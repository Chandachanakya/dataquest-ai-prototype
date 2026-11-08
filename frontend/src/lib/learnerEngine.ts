/**
 * Learner State Engine
 * 
 * This module implements the core intelligence layer that:
 * 1. Determines learner states (STRUGGLING, FAST, CONSISTENT, DROP_RISK)
 * 2. Triggers personalized actions based on states
 * 3. Logs all decisions for auditability
 */

import { supabase } from '@/integrations/supabase/client';
import { getSmartRecommendations, calculateDropRiskScore, type QuestRecommendation, type DropRiskAnalysis } from './smartRecommendations';
import { getOptimalQuestSequence, getAdaptiveDifficultyLevel, selectBestIntervention, recordInterventionOutcome, type QuestSequence, type DifficultyRecommendation, type InterventionArm } from './reinforcementLearning';
import { predictDropRisk, getMLApiStatus } from './mlApiClient';
import { getUserExperimentGroup, type ExperimentGroup } from './experimentService';
import type { Quest } from './types';

/**
 * RECOMPUTE POLICY (Phase 0 - Defensible AI)
 * 
 * Learner state is recomputed in the following scenarios:
 * 1. After each quest attempt completion (via course completion handlers)
 * 2. On dashboard load (via useEffect in Dashboard.tsx)
 * 
 * This ensures state is always fresh and reflects the most recent learner behavior.
 */

export type LearnerState = 'STRUGGLING' | 'FAST' | 'CONSISTENT' | 'DROP_RISK' | 'NEW_LEARNER';

/**
 * COLD-START POLICY (Phase 4)
 *
 * The deployed Random Forest was trained on 749 simulated learners, each
 * having at least 1 attempt and a minimum activity_frequency of 1.
 * A learner with 0 attempts produces an out-of-distribution feature vector
 * (activity_frequency = 0, total_attempts = 0, average_score = 0, etc.)
 * which the model cannot evaluate reliably. Empirically, this produces
 * a dropout probability of ~0.99 — not because the learner is likely to
 * drop, but because the input vector lies entirely outside the model's
 * training distribution.
 *
 * Policy: If a learner has fewer than MIN_ATTEMPTS_FOR_ML attempts, skip
 * ML inference and assign the NEW_LEARNER state with a heuristic
 * onboarding-appropriate distribution.
 *
 * This threshold (5) was chosen empirically: at 5 attempts the model
 * starts producing discrimination (P ≈ 0.55 for typical early learners),
 * whereas below 3 attempts the prediction is unreliably high (P > 0.86).
 */
export const MIN_ATTEMPTS_FOR_ML = 5;

/** Authoritative 10-feature vector matching backend model training order */
export interface MLFeatures {
    days_since_last_active: number;
    activity_frequency: number;
    average_score: number;
    total_attempts: number;
    completion_time_vs_median: number;
    retry_ratio: number;
    score_variance: number;
    recent_xp_velocity: number;
    completion_rate: number;
    avg_difficulty: number;
}

export interface LearnerMetrics extends MLFeatures {
    avgScore: number;           // Raw average percentage (0–100)
    normalizedAvgScore: number; // Training-normalized average score
    totalAttempts: number;
    avgCompletionTime: number;
    lastActiveDate: Date | null;
    recentXP: number;
    retryRatio: number;
    scoreVariance: number;
    completionRate: number;
    activityFrequency: number;
    avgDifficulty: number;
    completionTimeVsMedian: number;
    recentXpVelocity: number;
}

export type StateDistribution = Record<LearnerState, number>;

export interface StateResult {
    state: LearnerState; // The primary state (highest probability)
    reason: string;
    metrics: LearnerMetrics;
    confidenceScore: number; // Decision confidence (margin between top states)
    distribution: StateDistribution; // Normalized probability distribution summing to 1.0
    decisionSource?: 'ml_api' | 'heuristic' | 'cold_start'; // Track prediction source
    mlModelVersion?: string; // ML model version if used
    experimentGroup?: ExperimentGroup; // A/B test group assignment
}

/** Difficulty string to numeric scale (1–4) */
export const DIFFICULTY_NUMERIC_MAP: Record<string, number> = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
};

/** Dataset median completion time in seconds, derived empirically from the quest_attempts corpus */
export const DATASET_MEDIAN_TIME = 599.0;

/**
 * Calculate learner metrics from quest_attempts with unified feature definitions.
 * Conforms strictly to backend/ml_pipeline/engineer_features.py.
 */
async function calculateMetrics(userId: string): Promise<LearnerMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get ALL attempts in last 30 days
    const { data: attempts, error } = await supabase
        .from('quest_attempts')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString());

    if (error) {
        console.error('Error fetching attempts:', error);
    }

    const safeAttempts = attempts || [];
    const totalAttempts = safeAttempts.length;

    // Fetch quest details for difficulty mapping
    const questIds = [...new Set(safeAttempts.map(a => a.quest_id))];
    let questDifficultyMap = new Map<string, number>();

    if (questIds.length > 0) {
        const { data: quests } = await supabase
            .from('quests')
            .select('id, difficulty')
            .in('id', questIds);

        questDifficultyMap = new Map(
            quests?.map(q => [q.id, DIFFICULTY_NUMERIC_MAP[q.difficulty] || 1]) || []
        );
    }

    const completedAttempts = safeAttempts.filter(a => a.status === 'completed');
    const successfulCompletions = completedAttempts.length;

    // 1. days_since_last_active (days since latest attempt; 30.0 if zero attempts)
    const lastActiveDate = safeAttempts.length > 0
        ? new Date(Math.max(...safeAttempts.map(a => new Date(a.started_at).getTime())))
        : null;
    const daysSinceLastActive = lastActiveDate
        ? Math.max(0, (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30.0;

    // 2. activity_frequency (distinct active calendar dates in 30-day window)
    const activeDates = new Set(
        safeAttempts.map(a => new Date(a.started_at).toISOString().split('T')[0])
    );
    const activityFrequency = activeDates.size;

    // 3. average_score: in training, normalized by difficulty factor: (score / (diff * 10)) * 100
    // Also track rawAvgScore (0-100) for standard UI rendering
    let rawScoreSum = 0;
    let normScoreSum = 0;

    safeAttempts.forEach(a => {
        const rawScore = Number(a.score) || 0;
        const diff = questDifficultyMap.get(a.quest_id) || 1;
        rawScoreSum += rawScore;
        normScoreSum += (rawScore / (diff * 10)) * 100;
    });

    const avgScore = totalAttempts > 0 ? rawScoreSum / totalAttempts : 0.0;
    const normalizedAvgScore = totalAttempts > 0 ? normScoreSum / totalAttempts : 0.0;

    // 4. total_attempts
    // totalAttempts

    // 5. completion_time_vs_median: user's mean completed time vs platform baseline (599s)
    const completedWithTime = completedAttempts.filter(a => a.completion_time && a.completion_time > 0);
    const meanCompletionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, a) => sum + Number(a.completion_time), 0) / completedWithTime.length
        : DATASET_MEDIAN_TIME;
    const completionTimeVsMedian = meanCompletionTime / DATASET_MEDIAN_TIME;

    // 6. retry_ratio: total attempts / unique quests attempted
    const uniqueQuestsCount = new Set(safeAttempts.map(a => a.quest_id)).size;
    const retryRatio = uniqueQuestsCount > 0 ? totalAttempts / uniqueQuestsCount : 1.0;

    // 7. score_variance: sample standard deviation (ddof=1) of scores across attempts
    let scoreVariance = 0.0;
    if (totalAttempts > 1) {
        const varianceSum = safeAttempts.reduce((sum, a) => {
            const diff = (Number(a.score) || 0) - avgScore;
            return sum + (diff * diff);
        }, 0);
        scoreVariance = Math.sqrt(varianceSum / (totalAttempts - 1));
    }

    // 8. recent_xp_velocity: sum of scores in trailing 7 days divided by 7.0
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAttempts = safeAttempts.filter(a => new Date(a.started_at) >= sevenDaysAgo);
    const recentScoreSum = recentAttempts.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
    const recentXpVelocity = recentScoreSum / 7.0;

    // 9. completion_rate: completed / total attempts
    const completionRate = totalAttempts > 0 ? successfulCompletions / totalAttempts : 0.0;

    // 10. avg_difficulty: mean numeric difficulty across attempts
    const sumDifficulty = safeAttempts.reduce((sum, a) => sum + (questDifficultyMap.get(a.quest_id) || 1), 0);
    const avgDifficulty = totalAttempts > 0 ? sumDifficulty / totalAttempts : 1.0;

    // Profile XP for streak/gamification checks
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

    return {
        // Authoritative 10 ML Features
        days_since_last_active: Number(daysSinceLastActive.toFixed(2)),
        activity_frequency: activityFrequency,
        average_score: Number(normalizedAvgScore.toFixed(2)),
        total_attempts: totalAttempts,
        completion_time_vs_median: Number(completionTimeVsMedian.toFixed(4)),
        retry_ratio: Number(retryRatio.toFixed(4)),
        score_variance: Number(scoreVariance.toFixed(2)),
        recent_xp_velocity: Number(recentXpVelocity.toFixed(4)),
        completion_rate: Number(completionRate.toFixed(4)),
        avg_difficulty: Number(avgDifficulty.toFixed(2)),

        // Human-readable convenience metrics
        avgScore: Number(avgScore.toFixed(1)),
        normalizedAvgScore: Number(normalizedAvgScore.toFixed(2)),
        totalAttempts,
        avgCompletionTime: Math.round(meanCompletionTime),
        lastActiveDate,
        recentXP: profile?.xp || 0,
        retryRatio: Number(retryRatio.toFixed(2)),
        scoreVariance: Number(scoreVariance.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
        activityFrequency,
        avgDifficulty: Number(avgDifficulty.toFixed(2)),
        completionTimeVsMedian: Number(completionTimeVsMedian.toFixed(2)),
        recentXpVelocity: Number(recentXpVelocity.toFixed(2)),
    };
}

/**
 * Extract authoritative 10-feature vector for the ML API.
 * Ensures strict parity with training pipeline.
 */
export async function extractLearnerFeatures(userId: string): Promise<MLFeatures> {
    const metrics = await calculateMetrics(userId);
    return {
        days_since_last_active: metrics.days_since_last_active,
        activity_frequency: metrics.activity_frequency,
        average_score: metrics.average_score,
        total_attempts: metrics.total_attempts,
        completion_time_vs_median: metrics.completion_time_vs_median,
        retry_ratio: metrics.retry_ratio,
        score_variance: metrics.score_variance,
        recent_xp_velocity: metrics.recent_xp_velocity,
        completion_rate: metrics.completion_rate,
        avg_difficulty: metrics.avg_difficulty,
    };
}

/**
 * Calculate decision confidence score
 * 
 * CONFIDENCE CALCULATION (Phase 0):
 * - Based on two factors: sample size and recency
 * - Sample Size Component: Uses logarithmic scaling to diminish returns
 *   Formula: min(1.0, log10(totalAttempts + 1) / log10(10))
 *   (10 attempts = ~1.0 confidence, fewer = proportionally less)
 * - Recency Component: Sigmoid decay based on days since last activity
 *   Formula: 1.0 / (1 + exp(-(10 - daysSinceActive) / 3))
 *   (Recent activity = high confidence, old activity = low confidence)
 * - Final: Average of both components
 */
function calculateConfidence(totalAttempts: number, daysSinceActive: number): number {
    // Sample size component (0 to 1, logarithmic)
    const sampleSizeConfidence = Math.min(1.0, Math.log10(totalAttempts + 1) / Math.log10(10));

    // Recency component (0 to 1, sigmoid)
    // Recent activity (0-7 days) = high confidence
    // Old activity (14+ days) = low confidence
    const recencyConfidence = 1.0 / (1 + Math.exp(-(10 - daysSinceActive) / 3));

    // Average both components
    return (sampleSizeConfidence + recencyConfidence) / 2;
}

/**
 * Determine learner state based on metrics using Probabilistic Modeling (Phase 2)
 * 
 * PHASE 4 ML INTEGRATION:
 * - First attempts to use ML API for drop risk prediction if enabled
 * - Falls back to heuristic logic if ML API is unavailable
 * - Logs decision source for A/B testing analysis
 * 
 * PHASE 5 A/B TESTING:
 * - Checks experiment group assignment
 * - Forces ML (treatment) or heuristic (control) based on group
 * - Tracks experiment group in results
 */
export async function determineLearnerState(userId: string): Promise<StateResult> {
    const metrics = await calculateMetrics(userId);
    const daysSinceActive = metrics.lastActiveDate
        ? (Date.now() - metrics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
        : 30;

    // ── COLD-START GUARD (Phase 4) ────────────────────────────────────────────
    // The Random Forest was trained on learners with at least 1 attempt and
    // activity_frequency ≥ 1. A learner below MIN_ATTEMPTS_FOR_ML sits entirely
    // outside the model's training distribution, producing spuriously high risk
    // probabilities (empirically ≥ 0.86 for 1–2 attempts).
    // We bypass ML inference and assign NEW_LEARNER unconditionally in this case.
    if (metrics.total_attempts < MIN_ATTEMPTS_FOR_ML) {
        const experimentGroup = await getUserExperimentGroup(userId, 'ml_vs_heuristic');
        const coldStartDistribution: StateDistribution = {
            'NEW_LEARNER': 1.0000,
            'STRUGGLING': 0.0000,
            'FAST': 0.0000,
            'CONSISTENT': 0.0000,
            'DROP_RISK': 0.0000,
        };
        return {
            state: 'NEW_LEARNER',
            reason: `Insufficient interaction history (${metrics.total_attempts} attempt(s)). ML inference requires ≥${MIN_ATTEMPTS_FOR_ML} attempts. Onboarding support is active.`,
            metrics,
            confidenceScore: 0.5,
            distribution: coldStartDistribution,
            decisionSource: 'cold_start',
            experimentGroup,
        };
    }

    // PHASE 5: Check experiment assignment
    const experimentGroup = await getUserExperimentGroup(userId, 'ml_vs_heuristic');
    const forceML = experimentGroup === 'treatment';
    const forceHeuristic = experimentGroup === 'control';

    // PHASE 4: Authoritative 10-feature vector matching backend model training
    const mlFeatures: MLFeatures = {
        days_since_last_active: metrics.days_since_last_active,
        activity_frequency: metrics.activity_frequency,
        average_score: metrics.average_score,
        total_attempts: metrics.total_attempts,
        completion_time_vs_median: metrics.completion_time_vs_median,
        retry_ratio: metrics.retry_ratio,
        score_variance: metrics.score_variance,
        recent_xp_velocity: metrics.recent_xp_velocity,
        completion_rate: metrics.completion_rate,
        avg_difficulty: metrics.avg_difficulty
    };

    // Only try ML API if not forced to use heuristics
    const mlPrediction = !forceHeuristic ? await predictDropRisk(userId, mlFeatures) : null;

    if (mlPrediction && !forceHeuristic) {
        const dropProb = Math.max(0.0, Math.min(1.0, mlPrediction.probability));
        const perfRatio = Math.max(0.0, Math.min(1.0, metrics.avgScore / 100));
        const completionRate = Math.max(0.0, Math.min(1.0, metrics.completion_rate));

        // 1. Determine ML-grounded primary state (all 4 states reachable)
        let mlState: LearnerState;
        let reason = '';

        if (dropProb >= 0.70 || mlPrediction.risk_level === 'high') {
            mlState = 'DROP_RISK';
            reason = `ML prediction (${mlPrediction.model_version}): High churn risk (${(dropProb * 100).toFixed(0)}%). Inactivity or engagement deceleration detected.`;
        } else if (dropProb >= 0.40 || mlPrediction.risk_level === 'medium') {
            mlState = 'STRUGGLING';
            reason = `ML prediction (${mlPrediction.model_version}): Moderate struggle/risk (${(dropProb * 100).toFixed(0)}%). Difficulties with content pace or persistence detected.`;
        } else {
            // Low risk (P < 0.40): Distinguish FAST from CONSISTENT
            if (metrics.avgScore >= 75 && completionRate >= 0.70 && metrics.total_attempts > 0) {
                mlState = 'FAST';
                reason = `ML prediction (${mlPrediction.model_version}): Low risk (${(dropProb * 100).toFixed(0)}%) with high accuracy (${metrics.avgScore.toFixed(0)}%) and completion rate (${(completionRate * 100).toFixed(0)}%).`;
            } else {
                mlState = 'CONSISTENT';
                reason = `ML prediction (${mlPrediction.model_version}): Low risk (${(dropProb * 100).toFixed(0)}%) with steady progression and moderate consistency.`;
            }
        }

        // 2. Mathematically valid 4-state probability distribution (sums strictly to 1.0)
        const rawWeights: Record<LearnerState, number> = {
            'DROP_RISK': Math.max(0.01, Math.pow(dropProb, 1.5) * 3.0),
            'STRUGGLING': Math.max(0.01, (1.0 - perfRatio) * (0.6 + 2.0 * Math.max(0, 0.4 - Math.abs(dropProb - 0.5)))),
            'FAST': Math.max(0.01, (1.0 - dropProb) * Math.pow(perfRatio, 2) * (completionRate >= 0.7 ? 2.5 : 0.8)),
            'CONSISTENT': Math.max(0.01, (1.0 - dropProb) * (1.0 - Math.abs(perfRatio - 0.7) * 0.8) + 0.15)
        };

        const totalWeight = Object.values(rawWeights).reduce((sum, w) => sum + w, 0) || 1.0;
        const distribution: StateDistribution = {
            'DROP_RISK': Number((rawWeights.DROP_RISK / totalWeight).toFixed(4)),
            'STRUGGLING': Number((rawWeights.STRUGGLING / totalWeight).toFixed(4)),
            'FAST': Number((rawWeights.FAST / totalWeight).toFixed(4)),
            'CONSISTENT': Number((rawWeights.CONSISTENT / totalWeight).toFixed(4))
        };

        // Guarantee exact sum of 1.0000 by adjusting the largest category for rounding residue
        const sumProbs = distribution.DROP_RISK + distribution.STRUGGLING + distribution.FAST + distribution.CONSISTENT;
        const residue = 1.0 - sumProbs;
        distribution[mlState] = Number((distribution[mlState] + residue).toFixed(4));

        // 3. Derived confidenceScore (margin between top 2 states in 4-state distribution)
        const sortedProbs = Object.values(distribution).sort((a, b) => b - a);
        const margin = sortedProbs[0] - sortedProbs[1];
        const confidenceScore = Math.min(1.0, Math.max(0.1, Number((margin * 2 + 0.2).toFixed(2))));

        return {
            state: mlState,
            reason,
            metrics,
            confidenceScore,
            distribution,
            decisionSource: 'ml_api',
            mlModelVersion: mlPrediction.model_version,
            experimentGroup
        };
    }

    // FALLBACK: Use heuristic logic
    if (forceHeuristic) {
        console.log('Using heuristic learner state determination (control group)');
    } else if (forceML) {
        console.warn('ML API unavailable for treatment group - falling back to heuristics');
    } else {
        console.log('Using heuristic learner state determination');
    }

    // 1. Calculate Raw Scores for each state using raw 0-100 scale metrics
    const scores: Record<LearnerState, number> = {
        'STRUGGLING': 0,
        'FAST': 0,
        'CONSISTENT': 0,
        'DROP_RISK': 0
    };

    // STRUGGLING Score: low raw score or excessive retries
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (60 - metrics.avgScore) / 20);
        const retryFactor = Math.max(0, metrics.retryRatio - 1.2);
        scores['STRUGGLING'] = scoreFactor + retryFactor;
    }

    // FAST Score: high raw score and high XP velocity
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (metrics.avgScore - 75) / 10);
        const xpFactor = metrics.recent_xp_velocity > 30 ? 1 : 0;
        scores['FAST'] = scoreFactor + xpFactor;
    }

    // DROP_RISK Score: inactivity penalty
    scores['DROP_RISK'] = Math.min(3, Math.max(0, (daysSinceActive - 3) / 2));

    // CONSISTENT Score: stability and completion follow-through
    const varianceBonus = Math.max(0, 2 - (metrics.scoreVariance / 20));
    scores['CONSISTENT'] = 0.5 + varianceBonus + (metrics.completionRate * 1.5);

    // 2. Normalize to Probability Distribution
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const distribution: StateDistribution = {
        'STRUGGLING': Number((scores['STRUGGLING'] / totalScore).toFixed(4)),
        'FAST': Number((scores['FAST'] / totalScore).toFixed(4)),
        'CONSISTENT': Number((scores['CONSISTENT'] / totalScore).toFixed(4)),
        'DROP_RISK': Number((scores['DROP_RISK'] / totalScore).toFixed(4))
    };

    // Guarantee exact sum of 1.0000
    const sumHeuristic = distribution.DROP_RISK + distribution.STRUGGLING + distribution.FAST + distribution.CONSISTENT;
    const heuristicResidue = 1.0 - sumHeuristic;

    // 3. Determine Primary State and Confidence
    let primaryState: LearnerState = 'CONSISTENT';
    let maxProb = -1;
    let secondMaxProb = -1;

    for (const [state, prob] of Object.entries(distribution) as [LearnerState, number][]) {
        if (prob > maxProb) {
            secondMaxProb = maxProb;
            maxProb = prob;
            primaryState = state;
        } else if (prob > secondMaxProb) {
            secondMaxProb = prob;
        }
    }

    distribution[primaryState] = Number((distribution[primaryState] + heuristicResidue).toFixed(4));

    const margin = maxProb - secondMaxProb;
    const confidenceScore = Math.min(1.0, Math.max(0.1, Number((margin * 2 + 0.2).toFixed(2))));

    // Generate reason
    let reason = '';
    switch (primaryState) {
        case 'STRUGGLING':
            reason = `High struggle probability (${(distribution.STRUGGLING * 100).toFixed(0)}%). Low scores or high retries detected.`;
            break;
        case 'FAST':
            reason = `Identified as fast learner (${(distribution.FAST * 100).toFixed(0)}%). High efficiency and scores.`;
            break;
        case 'DROP_RISK':
            reason = `High churn risk (${(distribution.DROP_RISK * 100).toFixed(0)}%). Inactive for ${Math.round(daysSinceActive)} days.`;
            break;
        case 'CONSISTENT':
            reason = `Steady progress detected (${(distribution.CONSISTENT * 100).toFixed(0)}%). Consistent performance.`;
            break;
    }

    return {
        state: primaryState,
        reason,
        metrics,
        confidenceScore,
        distribution,
        decisionSource: 'heuristic',
        experimentGroup
    };
}

export interface DecisionMetadata {
    metrics?: LearnerMetrics;
    distribution?: StateDistribution;
    topTwoStates?: [string, number][];
    dropout_probability?: number | null;
    intervention_case?: string | null;
    intervention_accepted?: boolean | null;
    [key: string]: unknown;
}

/**
 * Log decision to decision_logs table
 * PHASE 4: Now includes decision source (ML vs heuristic) for A/B testing
 * PHASE 5: Includes experiment group assignment
 * PHASE 6: Includes intervention fields (dropout_probability, intervention_case, intervention_accepted)
 */
async function logDecision(
    userId: string,
    state: LearnerState,
    action: string,
    reason: string,
    confidenceScore: number,
    metadata: DecisionMetadata = {},
    experimentGroup?: ExperimentGroup
) {
    await supabase.from('decision_logs').insert({
        user_id: userId,
        state_detected: state,
        action_taken: action,
        reason,
        confidence_score: confidenceScore,
        metadata: {
            ...metadata,
            ml_api_status: getMLApiStatus(),       // Track ML API availability
            experiment_group: experimentGroup,      // Track A/B test group
            // Intervention fields (populated when triggered via POST /predict-drop-risk)
            dropout_probability: metadata.dropout_probability ?? null,
            intervention_case: metadata.intervention_case ?? null,
            intervention_accepted: metadata.intervention_accepted ?? null,
        },
        timestamp: new Date().toISOString()
    });
}

/**
 * Trigger personalized action based on learner state
 */
export async function triggerPersonalization(userId: string, stateResult: StateResult) {
    const { state, reason, metrics, distribution, experimentGroup } = stateResult;

    // We pass the distribution into metadata for logging
    const metadata = {
        metrics,
        distribution,
        topTwoStates: Object.entries(distribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
    };

    switch (state) {
        case 'NEW_LEARNER':
            // Action: Onboarding support — route to beginner track, do not trigger retention alerts
            await logDecision(
                userId,
                state,
                'ONBOARDING_SUPPORT',
                reason,
                stateResult.confidenceScore,
                metadata,
                experimentGroup
            );
            break;

        case 'STRUGGLING':
            // Action: Assign revision quest (placeholder - would need quest recommendation logic)
            await logDecision(
                userId,
                state,
                'RECOMMEND_REVISION',
                reason,
                stateResult.confidenceScore,
                metadata,
                experimentGroup
            );
            break;

        case 'FAST':
            // Action: Unlock challenge quest
            await logDecision(
                userId,
                state,
                'UNLOCK_CHALLENGE',
                reason,
                stateResult.confidenceScore,
                metadata,
                experimentGroup
            );
            break;

        case 'DROP_RISK':
            // Action: Send re-engagement notification
            await logDecision(
                userId,
                state,
                'SEND_REENGAGEMENT',
                reason,
                stateResult.confidenceScore,
                metadata,
                experimentGroup
            );
            break;

        case 'CONSISTENT':
            // Action: Positive reinforcement
            await logDecision(
                userId,
                state,
                'POSITIVE_REINFORCEMENT',
                reason,
                stateResult.confidenceScore,
                metadata,
                experimentGroup
            );
            break;
    }
}

/**
 * Main function to check learner state and trigger actions
 */
export async function checkAndActOnLearnerState(userId: string) {
    const stateResult = await determineLearnerState(userId);
    await triggerPersonalization(userId, stateResult);
    return stateResult;
}

/**
 * PHASE 1: Smart Recommendations
 * Get personalized quest recommendations using collaborative filtering
 */
export async function getRecommendationsForUser(userId: string): Promise<QuestRecommendation[]> {
    return await getSmartRecommendations(userId);
}

/**
 * PHASE 1: Drop Risk Analysis
 * Calculate drop risk score with detailed factor breakdown
 */
export async function getDropRiskAnalysis(userId: string): Promise<DropRiskAnalysis> {
    return await calculateDropRiskScore(userId);
}

/**
 * PHASE 2: RL-Based Quest Sequencing
 * Get optimal quest sequence using Q-learning simulation
 */
export async function getOptimalLearningPath(userId: string, availableQuests: Quest[]): Promise<QuestSequence[]> {
    return await getOptimalQuestSequence(userId, availableQuests);
}

/**
 * PHASE 2: Adaptive Difficulty
 * Get recommended difficulty level based on recent performance
 */
export async function getRecommendedDifficulty(userId: string): Promise<DifficultyRecommendation> {
    return await getAdaptiveDifficultyLevel(userId);
}

/**
 * PHASE 2: Multi-Armed Bandits
 * Select best intervention using Thompson sampling
 */
export async function getBestIntervention(userId: string, state: LearnerState): Promise<InterventionArm> {
    return await selectBestIntervention(userId, state);
}

/**
 * PHASE 2: Record Intervention Outcome
 * Track whether intervention was successful
 */
export async function trackInterventionOutcome(userId: string, interventionType: string, success: boolean): Promise<void> {
    return await recordInterventionOutcome(userId, interventionType, success);
}

// Re-export types for convenience
export type { QuestRecommendation, DropRiskAnalysis, QuestSequence, DifficultyRecommendation, InterventionArm };
