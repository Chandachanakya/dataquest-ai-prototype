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
import { predictDropRisk, predictIntervention, getMLApiStatus } from './mlApiClient';
import { getUserExperimentGroup, type ExperimentGroup } from './experimentService';

/**
 * RECOMPUTE POLICY (Phase 0 - Defensible AI)
 * 
 * Learner state is recomputed in the following scenarios:
 * 1. After each quest attempt completion (via course completion handlers)
 * 2. On dashboard load (via useEffect in Dashboard.tsx)
 * 
 * This ensures state is always fresh and reflects the most recent learner behavior.
 */

export type LearnerState = 'STRUGGLING' | 'FAST' | 'CONSISTENT' | 'DROP_RISK';

export interface LearnerMetrics {
    avgScore: number;
    normalizedAvgScore: number; // Normalized by difficulty
    totalAttempts: number;
    avgCompletionTime: number;
    lastActiveDate: Date | null;
    recentXP: number;
    retryRatio: number;      // attempts / completions (Persistence)
    scoreVariance: number;   // Variance of recent scores (Consistency)
    completionRate: number;  // completions / starts
}

export type StateDistribution = Record<LearnerState, number>;

export interface StateResult {
    state: LearnerState; // The primary state (highest probability)
    reason: string;
    metrics: LearnerMetrics;
    confidenceScore: number; // Decision confidence
    distribution: StateDistribution; // NEW: Full probability distribution
    decisionSource?: 'ml_api' | 'heuristic'; // Track prediction source
    mlModelVersion?: string; // ML model version if used
    experimentGroup?: ExperimentGroup; // A/B test group assignment
}

/**
 * Calculate learner metrics from quest_attempts with normalization
 * 
 * METRIC NORMALIZATION (Phase 0):
 * - Scores are normalized by quest difficulty to ensure fair comparison
 * - Difficulty multipliers: Beginner=0.8, Intermediate=1.0, Advanced=1.2
 * 
 * BEHAVIORAL FEATURES (Phase 1):
 * - retryRatio: Indicates persistence (higher is more retries)
 * - scoreVariance: Indicates consistency (lower is more consistent)
 * - completionRate: Indicates follow-through
 */
async function calculateMetrics(userId: string): Promise<LearnerMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get ALL attempts in last 30 days (completed or not)
    const { data: attempts, error } = await supabase
        .from('quest_attempts')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString());

    if (error) {
        console.error('Error fetching attempts:', error);
        return {
            avgScore: 0,
            normalizedAvgScore: 0,
            totalAttempts: 0,
            avgCompletionTime: 0,
            lastActiveDate: null,
            recentXP: 0,
            retryRatio: 0,
            scoreVariance: 0,
            completionRate: 0
        };
    }

    const totalAttempts = attempts?.length || 0;

    if (totalAttempts === 0) {
        return {
            avgScore: 0,
            normalizedAvgScore: 0,
            totalAttempts: 0,
            avgCompletionTime: 0,
            lastActiveDate: null,
            recentXP: 0,
            retryRatio: 0,
            scoreVariance: 0,
            completionRate: 0
        };
    }

    // Filter for completed attempts for score calculations
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    const successfulCompletions = completedAttempts.length;

    // Fetch quest details separately for difficulty normalization
    const questIds = [...new Set(attempts.map(a => a.quest_id))];
    const { data: quests } = await supabase
        .from('quests')
        .select('id, difficulty')
        .in('id', questIds);

    const questDifficultyMap = new Map(
        quests?.map(q => [q.id, q.difficulty]) || []
    );

    // Difficulty multipliers for normalization
    const difficultyMultipliers: Record<string, number> = {
        'beginner': 0.8,
        'intermediate': 1.0,
        'advanced': 1.2
    };

    // Calculate raw and normalized scores (only for completed attempts)
    const avgScore = successfulCompletions > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / successfulCompletions
        : 0;

    const normalizedScores = completedAttempts.map(a => {
        const difficulty = questDifficultyMap.get(a.quest_id) || 'intermediate';
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        return (a.score || 0) * multiplier;
    });
    const normalizedAvgScore = successfulCompletions > 0
        ? normalizedScores.reduce((sum, s) => sum + s, 0) / successfulCompletions
        : 0;

    const avgCompletionTime = successfulCompletions > 0
        ? completedAttempts
            .filter(a => a.completion_time)
            .reduce((sum, a) => sum + (a.completion_time || 0), 0) / successfulCompletions
        : 0;

    const lastActiveDate = attempts.length > 0
        ? new Date(Math.max(...attempts.map(a => new Date(a.started_at).getTime())))
        : null;

    // Get recent XP from user_progress
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

    // --- BEHAVIORAL FEATURES CALCULATION ---

    // Retry Ratio: Total attempts / Successful completions
    const retryRatio = successfulCompletions > 0 ? totalAttempts / successfulCompletions : totalAttempts;

    // Completion Rate: Successful completions / Total starts
    const completionRate = totalAttempts > 0 ? successfulCompletions / totalAttempts : 0;

    // Score Variance: sum((x - mean)^2) / n
    let scoreVariance = 0;
    if (successfulCompletions > 1) {
        const varianceSum = completedAttempts.reduce((sum, a) => {
            const diff = (a.score || 0) - avgScore;
            return sum + (diff * diff);
        }, 0);
        scoreVariance = varianceSum / successfulCompletions;
    }

    return {
        avgScore,
        normalizedAvgScore,
        totalAttempts,
        avgCompletionTime,
        lastActiveDate,
        recentXP: profile?.xp || 0,
        retryRatio,
        scoreVariance,
        completionRate
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

    // PHASE 5: Check experiment assignment
    const experimentGroup = await getUserExperimentGroup(userId, 'ml_vs_heuristic');
    const forceML = experimentGroup === 'treatment';
    const forceHeuristic = experimentGroup === 'control';

    // PHASE 4: Try ML API (if enabled OR if in treatment group)
    const mlFeatures = {
        days_since_last_active: daysSinceActive,
        activity_frequency: metrics.totalAttempts > 0 ? metrics.totalAttempts / 30 : 0,
        average_score: metrics.normalizedAvgScore,
        total_attempts: metrics.totalAttempts,
        completion_time_vs_median: 1.0, // Placeholder
        retry_ratio: metrics.retryRatio,
        score_variance: metrics.scoreVariance,
        recent_xp_velocity: metrics.recentXP / 7
    };

    // Only try ML API if not forced to use heuristics
    const mlPrediction = !forceHeuristic ? await predictDropRisk(userId, mlFeatures) : null;

    if (mlPrediction && !forceHeuristic) {
        // ML API succeeded - use ML prediction
        const mlState: LearnerState = mlPrediction.risk_level === 'high' ? 'DROP_RISK' :
            mlPrediction.risk_level === 'medium' ? 'STRUGGLING' :
                mlPrediction.probability > 0.6 ? 'FAST' : 'CONSISTENT';

        // Create distribution based on ML probability
        const distribution: StateDistribution = {
            'DROP_RISK': mlPrediction.risk_level === 'high' ? mlPrediction.probability : 0.1,
            'STRUGGLING': mlPrediction.risk_level === 'medium' ? mlPrediction.probability : 0.2,
            'FAST': mlPrediction.probability < 0.3 && metrics.normalizedAvgScore > 75 ? 0.4 : 0.1,
            'CONSISTENT': 1 - mlPrediction.probability
        };

        return {
            state: mlState,
            reason: `ML prediction (${mlPrediction.model_version}): ${mlPrediction.risk_level} risk (${(mlPrediction.probability * 100).toFixed(0)}%)`,
            metrics,
            confidenceScore: mlPrediction.probability,
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

    // 1. Calculate Raw Scores for each state
    const scores: Record<LearnerState, number> = {
        'STRUGGLING': 0,
        'FAST': 0,
        'CONSISTENT': 0,
        'DROP_RISK': 0
    };

    // STRUGGLING Score
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (60 - metrics.normalizedAvgScore) / 20);
        const retryFactor = Math.max(0, metrics.retryRatio - 1.2);
        scores['STRUGGLING'] = scoreFactor + retryFactor;
    }

    // FAST Score
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (metrics.normalizedAvgScore - 75) / 10);
        const xpFactor = metrics.recentXP > 200 ? 1 : 0;
        scores['FAST'] = scoreFactor + xpFactor;
    }

    // DROP_RISK Score
    scores['DROP_RISK'] = Math.min(3, Math.max(0, (daysSinceActive - 3) / 2));

    // CONSISTENT Score
    const varianceBonus = Math.max(0, 2 - (metrics.scoreVariance / 100));
    scores['CONSISTENT'] = 0.5 + varianceBonus + (metrics.completionRate * 1.5);

    // 2. Normalize to Probability Distribution
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const distribution: StateDistribution = {
        'STRUGGLING': scores['STRUGGLING'] / totalScore,
        'FAST': scores['FAST'] / totalScore,
        'CONSISTENT': scores['CONSISTENT'] / totalScore,
        'DROP_RISK': scores['DROP_RISK'] / totalScore
    };

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

    const margin = maxProb - secondMaxProb;
    const confidenceScore = Math.min(1.0, margin * 2 + 0.2);

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
    metadata: Record<string, any> = {},
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
export async function getOptimalLearningPath(userId: string, availableQuests: any[]): Promise<QuestSequence[]> {
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
