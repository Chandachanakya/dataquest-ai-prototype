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
import type { Json } from './database.types';
import { calculateFeatureVector, filterAttemptsAtReferenceTime, DATASET_MEDIAN_TIME, DIFFICULTY_NUMERIC_MAP, isNewLearner, type FeatureAttempt, type MLFeatures } from './learnerFeatures';

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
 * NEW_LEARNER is an onboarding lifecycle state, not an inactivity label.
 * A learner with 0 attempts produces an out-of-distribution feature vector
 * (activity_frequency = 0, total_attempts = 0, average_score = 0, etc.)
 * which the model cannot evaluate reliably. Empirically, this produces
 * a dropout probability of ~0.99 — not because the learner is likely to
 * drop, but because the input vector lies entirely outside the model's
 * training distribution.
 *
 * Policy: only zero lifetime attempts bypass inference and receive onboarding.
 *
 * This threshold (5) was chosen empirically: at 5 attempts the model
 * starts producing discrimination (P ≈ 0.55 for typical early learners),
 * whereas below 3 attempts the prediction is unreliably high (P > 0.86).
 */

/** Authoritative 10-feature vector matching backend model training order */
export type { MLFeatures } from './learnerFeatures';

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
type ClassifiedLearnerState = Exclude<LearnerState, 'NEW_LEARNER'>;

const classifiedStates: ClassifiedLearnerState[] = ['STRUGGLING', 'FAST', 'CONSISTENT', 'DROP_RISK'];

/** Rule weights are a ranking aid, not calibrated probabilities. */
function normalizeStateWeights(weights: Record<ClassifiedLearnerState, number>): StateDistribution {
    const total = classifiedStates.reduce((sum, state) => sum + Math.max(0, weights[state]), 0) || 1;
    const distribution: StateDistribution = {
        NEW_LEARNER: 0,
        STRUGGLING: 0,
        FAST: 0,
        CONSISTENT: 0,
        DROP_RISK: 0,
    };
    for (const state of classifiedStates) distribution[state] = Number((Math.max(0, weights[state]) / total).toFixed(4));
    const primary = stateDistributionArgmax(distribution);
    distribution[primary] = Number((distribution[primary] + (1 - Object.values(distribution).reduce((sum, value) => sum + value, 0))).toFixed(4));
    return distribution;
}

export function stateDistributionArgmax(distribution: StateDistribution): LearnerState {
    return (Object.entries(distribution) as [LearnerState, number][])
        .reduce((best, candidate) => candidate[1] > best[1] ? candidate : best)[0];
}

export interface StateResult {
    state: LearnerState; // The primary state (highest probability)
    reason: string;
    metrics: LearnerMetrics;
    confidenceScore: number; // Heuristic separation score, not a statistically calibrated confidence
    distribution: StateDistribution; // Normalized rule-allocation values summing to 1.0
    decisionSource?: 'ml_api' | 'heuristic' | 'cold_start'; // Track prediction source
    mlModelVersion?: string; // ML model version if used
    experimentGroup?: ExperimentGroup; // A/B test group assignment
}

/** Difficulty labels map to the authoritative 1–6 model scale. */
export { DIFFICULTY_NUMERIC_MAP, DATASET_MEDIAN_TIME } from './learnerFeatures';

/**
 * Calculate learner metrics from quest_attempts with unified feature definitions.
 * Conforms strictly to backend/ml_pipeline/engineer_features.py.
 */
type EngineAttempt = FeatureAttempt & { user_id?: string };

/** Fetch failures are deliberately fatal: an unavailable history is not an empty history. */
async function calculateMetrics(
    userId: string,
    client: typeof supabase = supabase,
    referenceTime: string | Date = new Date(),
): Promise<LearnerMetrics> {
    // Lifetime history is required for model features and cold-start eligibility.
    const { data: attempts, error } = await client
        .from('quest_attempts')
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(`Unable to fetch quest attempts: ${error.message}`);
    if (!attempts) throw new Error('Unable to fetch quest attempts: query returned no data');

    // This is the authoritative collection for every metric below.
    const validAttempts = filterAttemptsAtReferenceTime(attempts as EngineAttempt[], referenceTime);

    // Fetch quest details for difficulty mapping
    const questIds = [...new Set(validAttempts.map(a => a.quest_id))];
    let questDifficultyMap = new Map<string, number>();

    if (questIds.length > 0) {
        const { data: quests, error: questError } = await client
            .from('quests')
            .select('id, difficulty')
            .in('id', questIds);

        if (questError) throw new Error(`Unable to fetch quest difficulties: ${questError.message}`);
        if (!quests) throw new Error('Unable to fetch quest difficulties: query returned no data');
        // A missing/unknown label is a genuine missing value and uses the documented
        // baseline (1); it is not used to conceal a failed lookup.
        questDifficultyMap = new Map(quests.map(q => [q.id, DIFFICULTY_NUMERIC_MAP[q.difficulty] ?? 1]));
    }

    const featureAttempts = validAttempts.map(a => ({ ...a, difficulty: questDifficultyMap.get(a.quest_id) ?? 1 }));
    const featureValues = calculateFeatureVector(featureAttempts, referenceTime);
    const totalAttempts = featureValues.total_attempts;
    const completedAttempts = featureAttempts.filter(a => a.status === 'completed');

    // last-ever activity is lifetime; rolling windows are handled by calculateFeatureVector.
    const lastActiveDate = featureAttempts.length > 0
        ? new Date(Math.max(...featureAttempts.map(a => a.timestamp)))
        : null;
    // Convenience metrics used by the UI.
    let rawScoreSum = 0;

    featureAttempts.forEach(a => {
        const candidate = Number(a.score);
        const rawScore = Number.isFinite(candidate) ? candidate : 0;
        rawScoreSum += rawScore;
    });

    const avgScore = totalAttempts > 0 ? rawScoreSum / totalAttempts : 0.0;
    const normalizedAvgScore = featureValues.average_score;
    const completedWithTime = completedAttempts.filter(a => a.completion_time && a.completion_time > 0);
    const meanCompletionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, a) => sum + Number(a.completion_time), 0) / completedWithTime.length
        : DATASET_MEDIAN_TIME;
    const completionTimeVsMedian = featureValues.completion_time_vs_median;
    const retryRatio = featureValues.retry_ratio;
    const scoreVariance = featureValues.score_variance;
    const completionRate = featureValues.completion_rate;
    const avgDifficulty = featureValues.avg_difficulty;

    // Profile XP for streak/gamification checks
    const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

    if (profileError) throw new Error(`Unable to fetch learner profile: ${profileError.message}`);

    return {
        // Authoritative 10 ML Features
        ...featureValues,

        // Human-readable convenience metrics
        avgScore: Number(avgScore.toFixed(1)),
        normalizedAvgScore: Number(normalizedAvgScore.toFixed(2)),
        totalAttempts,
        avgCompletionTime: Math.round(meanCompletionTime),
        lastActiveDate,
        recentXP: Number.isFinite(Number(profile?.xp)) ? Number(profile?.xp) : 0,
        retryRatio: Number(retryRatio.toFixed(2)),
        scoreVariance: Number(scoreVariance.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
        activityFrequency: featureValues.activity_frequency,
        avgDifficulty: Number(avgDifficulty.toFixed(2)),
        completionTimeVsMedian: Number(completionTimeVsMedian.toFixed(2)),
        recentXpVelocity: Number(featureValues.recent_xp_velocity.toFixed(2)),
    };
}

/** Test seam for database failure and temporal-data regression tests. */
export async function calculateLearnerMetricsForTesting(
    userId: string,
    client: typeof supabase,
    referenceTime: string | Date,
): Promise<LearnerMetrics> {
    return calculateMetrics(userId, client, referenceTime);
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
    // NEW_LEARNER is reserved for zero lifetime history; dormant learners retain history.
    if (isNewLearner(metrics.total_attempts)) {
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
            reason: 'No lifetime quest attempts. Onboarding support is active.',
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

        // The ML API supplies only dropout risk. These hand-crafted weights allocate
        // the four product states and are not calibrated class probabilities.
        const rawWeights: Record<ClassifiedLearnerState, number> = {
            'DROP_RISK': Math.max(0.01, Math.pow(dropProb, 1.5) * 3.0),
            'STRUGGLING': Math.max(0.01, (1.0 - perfRatio) * (0.6 + 2.0 * Math.max(0, 0.4 - Math.abs(dropProb - 0.5)))),
            'FAST': Math.max(0.01, (1.0 - dropProb) * Math.pow(perfRatio, 2) * (completionRate >= 0.7 ? 2.5 : 0.8)),
            'CONSISTENT': Math.max(0.01, (1.0 - dropProb) * (1.0 - Math.abs(perfRatio - 0.7) * 0.8) + 0.15)
        };

        const distribution = normalizeStateWeights(rawWeights);
        const primaryState = stateDistributionArgmax(distribution);
        if (primaryState !== mlState) {
            reason += ` The Random Forest estimate is dropout risk; the displayed ${primaryState} state is the highest rule-based state allocation.`;
        }

        // 3. Derived confidenceScore (margin between top 2 states in 4-state distribution)
        const sortedProbs = Object.values(distribution).sort((a, b) => b - a);
        const margin = sortedProbs[0] - sortedProbs[1];
        const confidenceScore = Math.min(1.0, Math.max(0.1, Number((margin * 2 + 0.2).toFixed(2))));

        return {
            state: primaryState,
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
    const scores: Record<ClassifiedLearnerState, number> = {
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
    const distribution = normalizeStateWeights(scores);
    const primaryState = stateDistributionArgmax(distribution);
    const sortedHeuristic = Object.values(distribution).sort((a, b) => b - a);
    const margin = sortedHeuristic[0] - sortedHeuristic[1];
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
        } as unknown as Json,
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
