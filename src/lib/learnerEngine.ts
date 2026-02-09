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

interface LearnerMetrics {
    avgScore: number;
    normalizedAvgScore: number; // NEW: Normalized by difficulty
    totalAttempts: number;
    avgCompletionTime: number;
    lastActiveDate: Date | null;
    recentXP: number;
}

interface StateResult {
    state: LearnerState;
    reason: string;
    metrics: LearnerMetrics;
    confidenceScore: number; // NEW: Decision confidence
}

/**
 * Calculate learner metrics from quest_attempts with normalization
 * 
 * METRIC NORMALIZATION (Phase 0):
 * - Scores are normalized by quest difficulty to ensure fair comparison
 * - Difficulty multipliers: Beginner=0.8, Intermediate=1.0, Advanced=1.2
 * - This prevents penalizing learners who attempt harder quests
 */
async function calculateMetrics(userId: string): Promise<LearnerMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all completed attempts in last 30 days
    const { data: attempts, error } = await supabase
        .from('quest_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo.toISOString());

    if (error) {
        console.error('Error fetching attempts:', error);
        return {
            avgScore: 0,
            normalizedAvgScore: 0,
            totalAttempts: 0,
            avgCompletionTime: 0,
            lastActiveDate: null,
            recentXP: 0
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
            recentXP: 0
        };
    }

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

    // Calculate raw and normalized scores
    const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts;

    const normalizedScores = attempts.map(a => {
        const difficulty = questDifficultyMap.get(a.quest_id) || 'intermediate';
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        return (a.score || 0) * multiplier;
    });
    const normalizedAvgScore = normalizedScores.reduce((sum, s) => sum + s, 0) / totalAttempts;

    const avgCompletionTime = attempts
        .filter(a => a.completion_time)
        .reduce((sum, a) => sum + (a.completion_time || 0), 0) / totalAttempts;

    const lastActiveDate = attempts.length > 0
        ? new Date(Math.max(...attempts.map(a => new Date(a.completed_at).getTime())))
        : null;

    // Get recent XP from user_progress
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();

    return {
        avgScore,
        normalizedAvgScore,
        totalAttempts,
        avgCompletionTime,
        lastActiveDate,
        recentXP: profile?.xp || 0
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
 * Determine learner state based on metrics
 * Priority: DROP_RISK > STRUGGLING > FAST > CONSISTENT
 * 
 * NOW USES NORMALIZED SCORES (Phase 0) for fairer assessment
 */
export async function determineLearnerState(userId: string): Promise<StateResult> {
    const metrics = await calculateMetrics(userId);

    // Thresholds (configurable)
    const DROP_RISK_DAYS = 7;
    const STRUGGLING_SCORE = 50;
    const STRUGGLING_MIN_ATTEMPTS = 3;
    const FAST_SCORE = 80;
    const FAST_MIN_XP = 200;

    const daysSinceActive = metrics.lastActiveDate
        ? (Date.now() - metrics.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

    // Calculate confidence score
    const confidenceScore = calculateConfidence(metrics.totalAttempts, daysSinceActive);

    // Priority 1: Drop Risk
    if (daysSinceActive > DROP_RISK_DAYS) {
        return {
            state: 'DROP_RISK',
            reason: `User inactive for ${Math.round(daysSinceActive)} days`,
            metrics,
            confidenceScore
        };
    }

    // Priority 2: Struggling (NOW USES NORMALIZED SCORE)
    if (metrics.normalizedAvgScore < STRUGGLING_SCORE && metrics.totalAttempts >= STRUGGLING_MIN_ATTEMPTS) {
        return {
            state: 'STRUGGLING',
            reason: `Low normalized score (${metrics.normalizedAvgScore.toFixed(1)}%) over ${metrics.totalAttempts} attempts`,
            metrics,
            confidenceScore
        };
    }

    // Priority 3: Fast (NOW USES NORMALIZED SCORE)
    if (metrics.normalizedAvgScore > FAST_SCORE && metrics.recentXP > FAST_MIN_XP) {
        return {
            state: 'FAST',
            reason: `High normalized score (${metrics.normalizedAvgScore.toFixed(1)}%) with ${metrics.recentXP} XP`,
            metrics,
            confidenceScore
        };
    }

    // Default: Consistent
    return {
        state: 'CONSISTENT',
        reason: 'Steady progress with no risk indicators',
        metrics,
        confidenceScore
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
    const { state, reason, metrics } = stateResult;

    switch (state) {
        case 'STRUGGLING':
            // Action: Assign revision quest (placeholder - would need quest recommendation logic)
            await logDecision(
                userId,
                state,
                'RECOMMEND_REVISION',
                reason,
                stateResult.confidenceScore,
                { avgScore: metrics.avgScore, totalAttempts: metrics.totalAttempts }
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
                { avgScore: metrics.avgScore, recentXP: metrics.recentXP }
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
                { daysSinceActive: Math.round((Date.now() - (metrics.lastActiveDate?.getTime() || 0)) / (1000 * 60 * 60 * 24)) }
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
                { avgScore: metrics.avgScore }
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
