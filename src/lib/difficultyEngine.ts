/**
 * Difficulty Engine
 * Thin wrapper over reinforcementLearning.getAdaptiveDifficultyLevel()
 * that adds:
 *  - Expert band (4th tier)
 *  - Per-quiz promotion / demotion rules (accuracy thresholds)
 *  - XP scaling multipliers per band
 *  - localStorage caching so the UI never blocks on the Supabase call
 */

import { getAdaptiveDifficultyLevel } from './reinforcementLearning';

export type DifficultyBand = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type DifficultyVerdict = 'promote' | 'maintain' | 'demote';

/** XP multiplier for each difficulty band */
export const XP_MULTIPLIERS: Record<DifficultyBand, number> = {
    beginner: 1.0,
    intermediate: 1.3,
    advanced: 1.6,
    expert: 2.0,
};

const PROMOTION_THRESHOLD = 85; // accuracy % → promote
const DEMOTION_THRESHOLD = 60; // accuracy % → demote

const BAND_ORDER: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'expert'];

/** Evaluate a single quiz result and return a verdict. */
export function evaluatePerformance(accuracyPercent: number): DifficultyVerdict {
    if (accuracyPercent >= PROMOTION_THRESHOLD) return 'promote';
    if (accuracyPercent <= DEMOTION_THRESHOLD) return 'demote';
    return 'maintain';
}

/** Given current band + verdict, return the next band. */
export function getNextDifficulty(current: DifficultyBand, verdict: DifficultyVerdict): DifficultyBand {
    const idx = BAND_ORDER.indexOf(current);
    if (verdict === 'promote') return BAND_ORDER[Math.min(idx + 1, BAND_ORDER.length - 1)];
    if (verdict === 'demote') return BAND_ORDER[Math.max(idx - 1, 0)];
    return current;
}

/** Apply XP scaling to a base reward. */
export function scaledXP(baseXP: number, band: DifficultyBand): number {
    return Math.round(baseXP * XP_MULTIPLIERS[band]);
}

const STORAGE_KEY = (userId: string) => `dq_difficulty_${userId}`;

/** Load user's current difficulty band (localStorage → default 'beginner'). */
export function getUserDifficulty(userId: string): DifficultyBand {
    try {
        const stored = localStorage.getItem(STORAGE_KEY(userId));
        if (stored && BAND_ORDER.includes(stored as DifficultyBand)) {
            return stored as DifficultyBand;
        }
    } catch { }
    return 'beginner';
}

/** Persist user's difficulty band to localStorage. */
export function saveUserDifficulty(userId: string, band: DifficultyBand): void {
    try {
        localStorage.setItem(STORAGE_KEY(userId), band);
    } catch { }
}

/**
 * Sync difficulty from Supabase (via RL engine) and cache locally.
 * Maps the engine's 3-band output to our 4-band system.
 * Call once on Dashboard load — then use getUserDifficulty() everywhere else.
 */
export async function syncDifficultyFromServer(userId: string): Promise<DifficultyBand> {
    try {
        const rec = await getAdaptiveDifficultyLevel(userId);
        // Map advanced + high confidence → expert
        const band: DifficultyBand =
            rec.level === 'advanced' && rec.confidence >= 0.85 &&
                rec.recentPerformance.avgScore >= 90
                ? 'expert'
                : (rec.level as DifficultyBand);
        saveUserDifficulty(userId, band);
        return band;
    } catch {
        return getUserDifficulty(userId);
    }
}

/** Human-readable label for a band. */
export const BAND_LABELS: Record<DifficultyBand, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
};

export const BAND_COLORS: Record<DifficultyBand, string> = {
    beginner: 'text-success',
    intermediate: 'text-accent',
    advanced: 'text-destructive',
    expert: 'text-purple-500',
};
