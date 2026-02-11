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
 * Instead of hard thresholds, we calculate a score for each state and normalize
 * them into a probability distribution. This provides "Uncertainty Modeling".
 */
export async function determineLearnerState(userId: string): Promise<StateResult> {
    const metrics = await calculateMetrics(userId);

    // 1. Calculate Raw Scores for each state
    const scores: Record<LearnerState, number> = {
        'STRUGGLING': 0,
        'FAST': 0,
        'CONSISTENT': 0,
        'DROP_RISK': 0
    };

    const daysSinceActive = metrics.lastActiveDate
        ? (Date.now() - metrics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
        : 30; // Default to 30 if null

    // STRUGGLING Score
    // High if low score, high retry ratio, low completion rate
    // Range approx 0-3
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (60 - metrics.normalizedAvgScore) / 20); // 0 at 60, 2 at 20
        const retryFactor = Math.max(0, metrics.retryRatio - 1.2); // Bonus if repeats often
        scores['STRUGGLING'] = scoreFactor + retryFactor;
    }

    // FAST Score
    // High if high score, fast completion, high recent XP
    // Range approx 0-3
    if (metrics.totalAttempts > 0) {
        const scoreFactor = Math.max(0, (metrics.normalizedAvgScore - 75) / 10); // 0 at 75, 2.5 at 100
        const xpFactor = metrics.recentXP > 200 ? 1 : 0;
        scores['FAST'] = scoreFactor + xpFactor;
    }

    // DROP_RISK Score
    // High if inactive for days
    // Range approx 0-3
    scores['DROP_RISK'] = Math.min(3, Math.max(0, (daysSinceActive - 3) / 2)); // 0 at 3 days, 1 at 5 days, 3 at 9+ days

    // CONSISTENT Score
    // Baseline score + consistency bonus (low variance)
    // Range approx 0-3
    const varianceBonus = Math.max(0, 2 - (metrics.scoreVariance / 100)); // Higher bonus for low variance
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

    // Confidence is the margin between 1st and 2nd choice (or just maxProb if dominant)
    // Scaled to 0-1 range where >0.2 is decent confidence
    const margin = maxProb - secondMaxProb;
    const confidenceScore = Math.min(1.0, margin * 2 + 0.2);

    // Generate reason based on primary state contributors
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
        distribution
    };
}

/**
 * Log decision to decision_logs table
 * NOW INCLUDES CONFIDENCE SCORE (Phase 0)
 */
async function logDecision(
    userId: string,
    state: LearnerState,
    action: string,
    reason: string,
    confidenceScore: number,
    metadata: Record<string, any> = {}
) {
    await supabase.from('decision_logs').insert({
        user_id: userId,
        state_detected: state,
        action_taken: action,
        reason,
        confidence_score: confidenceScore,
        metadata,
        timestamp: new Date().toISOString()
    });
}

/**
 * Trigger personalized action based on learner state
 */
export async function triggerPersonalization(userId: string, stateResult: StateResult) {
    const { state, reason, metrics, distribution } = stateResult;

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
                metadata
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
                metadata
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
                metadata
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
                metadata
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
