/**
 * Intervention Engine
 * Classifies dropout risk into one of 3 actionable cases
 * and builds the intervention payload shown to the user.
 */

import { supabase } from '@/integrations/supabase/client';

export type InterventionCase =
    | 'LOW_XP_VELOCITY'     // User isn't earning XP fast enough — near level-up boost
    | 'SLOW_COMPLETION'     // Taking much longer than peers — offer warm-up
    | 'LOW_COMPLETION_RATE' // Failing many quests — reduce difficulty + hints
    | null;                 // No intervention needed

export interface InterventionPayload {
    case: Exclude<InterventionCase, null>;
    message: string;
    cta: string;
    bonusXPMultiplier: number; // 1 = normal, 2 = double XP
    suggestedDifficulty: 'beginner' | 'intermediate' | 'advanced';
    enableHints: boolean;
}

export interface UserMetrics {
    recentXPVelocity: number;   // XP earned in last 7 days / 7
    avgCompletionTime: number;  // seconds
    completionRate: number;     // 0–1
    dropoutProbability: number; // from ML model
}

const DROPOUT_THRESHOLD = 0.70;
const LOW_XP_THRESHOLD = 10;   // XP/day
const SLOW_TIME_MULTIPLIER = 1.8;  // >1.8× dataset median (300s) = slow
const DATASET_MEDIAN_TIME = 300;  // seconds — default
const LOW_COMPLETION_RATE = 0.40;

/**
 * Classify which intervention case applies (priority order: completionRate → time → xp).
 */
export function classifyIntervention(metrics: UserMetrics): InterventionCase {
    if (metrics.dropoutProbability < DROPOUT_THRESHOLD) return null;

    if (metrics.completionRate < LOW_COMPLETION_RATE) {
        return 'LOW_COMPLETION_RATE';
    }
    if (metrics.avgCompletionTime > DATASET_MEDIAN_TIME * SLOW_TIME_MULTIPLIER) {
        return 'SLOW_COMPLETION';
    }
    if (metrics.recentXPVelocity < LOW_XP_THRESHOLD) {
        return 'LOW_XP_VELOCITY';
    }

    // Generic — default to the most common recovery: XP velocity boost
    return 'LOW_XP_VELOCITY';
}

/** Build the full intervention payload for the given case. */
export function buildIntervention(
    interventionCase: Exclude<InterventionCase, null>,
    currentXP: number,
    xpForNextLevel: number
): InterventionPayload {
    const xpNeeded = xpForNextLevel - currentXP;

    switch (interventionCase) {
        case 'LOW_XP_VELOCITY':
            return {
                case: 'LOW_XP_VELOCITY',
                message: `🚀 You're only ${xpNeeded} XP away from leveling up! Complete a quick challenge for **2× XP**.`,
                cta: '⚡ Claim 2× XP Challenge',
                bonusXPMultiplier: 2,
                suggestedDifficulty: 'intermediate',
                enableHints: false,
            };

        case 'SLOW_COMPLETION':
            return {
                case: 'SLOW_COMPLETION',
                message: '⚡ Taking it slow is fine! Want a quick warm-up challenge to build momentum?',
                cta: '🎯 Start Warm-Up Quest',
                bonusXPMultiplier: 1,
                suggestedDifficulty: 'beginner',
                enableHints: false,
            };

        case 'LOW_COMPLETION_RATE':
            return {
                case: 'LOW_COMPLETION_RATE',
                message: '🎯 Let\'s try a guided challenge — hints are enabled and difficulty is adjusted for you.',
                cta: '💡 Start Guided Mode',
                bonusXPMultiplier: 1,
                suggestedDifficulty: 'beginner',
                enableHints: true,
            };
    }
}

/**
 * Log the intervention event to decision_logs for future model improvement.
 */
export async function logInterventionEvent(
    userId: string,
    interventionCase: Exclude<InterventionCase, null>,
    probability: number,
    accepted: boolean
): Promise<void> {
    await supabase.from('decision_logs').insert({
        user_id: userId,
        state_detected: 'DROP_RISK',
        action_taken: `INTERVENTION_${interventionCase}`,
        reason: `Dropout probability ${(probability * 100).toFixed(0)}% triggered ${interventionCase} intervention. User ${accepted ? 'accepted' : 'dismissed'}.`,
        confidence_score: probability,
        metadata: {
            intervention_case: interventionCase,
            dropout_probability: probability,
            intervention_accepted: accepted,
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * Build UserMetrics object from Supabase data for a given user.
 * Used by QuestPage after quiz completion.
 */
export async function fetchUserMetricsForIntervention(userId: string): Promise<UserMetrics> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [attemptsRes, progressRes] = await Promise.all([
        supabase
            .from('quest_attempts')
            .select('score, completion_time, status, started_at')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(20),
        supabase
            .from('user_progress')
            .select('completed, xp_earned, completed_at')
            .eq('user_id', userId),
    ]);

    const attempts = attemptsRes.data ?? [];
    const progress = progressRes.data ?? [];

    // XP velocity: sum XP earned in last 7 days / 7
    const recentXP = progress
        .filter(p => p.completed && p.completed_at
            && new Date(p.completed_at) >= sevenDaysAgo)
        .reduce((sum, p) => sum + (p.xp_earned ?? 0), 0);
    const recentXPVelocity = recentXP / 7;

    // Avg completion time (completed attempts only)
    const completed = attempts.filter(a => a.status === 'completed' && a.completion_time != null);
    const avgCompletionTime = completed.length > 0
        ? completed.reduce((s, a) => s + (a.completion_time ?? 0), 0) / completed.length
        : 0;

    // Completion rate
    const completionRate = attempts.length > 0
        ? completed.length / attempts.length : 0;

    return { recentXPVelocity, avgCompletionTime, completionRate, dropoutProbability: 0 };
}
