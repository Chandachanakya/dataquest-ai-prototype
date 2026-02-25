/**
 * Streak Service
 * Tracks daily user activity streaks and milestone rewards.
 *
 * Storage strategy:
 *  - `streak` → profiles table (already exists)
 *  - `last_active_date` + `streak_freeze_available` → localStorage
 *    (avoids needing a DB migration for new columns)
 *
 * Rules:
 *  - Activity within same calendar day = streak maintained (no-op)
 *  - Consecutive day (yesterday) = streak + 1
 *  - Gap > 1 day + freeze available = streak maintained, freeze consumed
 *  - Gap > 1 day + no freeze = reset to 1
 *  - Milestone XP bonus at 7 / 14 / 30 days
 *  - Freeze granted automatically at each 7-day milestone
 */

import { supabase } from '@/integrations/supabase/client';

export interface StreakStatus {
    current: number;
    lastActiveDate: string | null;
    isFrozen: boolean;
    freezeAvailable: boolean;
    milestoneReached: number | null;
    bonusXP: number;
}

export const MILESTONE_REWARDS: Record<number, number> = {
    7: 100,
    14: 200,
    30: 500,
};

// ─── localStorage helpers ────────────────────────────────────────────
const keys = (uid: string) => ({
    lastActive: `dq_streak_last_active_${uid}`,
    freeze: `dq_streak_freeze_${uid}`,
});

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function isYesterday(date: Date, ref: Date): boolean {
    const y = new Date(ref);
    y.setDate(y.getDate() - 1);
    return isSameDay(date, y);
}

function loadLocalStreak(userId: string) {
    const k = keys(userId);
    return {
        lastActiveDate: localStorage.getItem(k.lastActive),
        freezeAvailable: localStorage.getItem(k.freeze) === 'true',
    };
}

function saveLocalStreak(
    userId: string,
    lastActive: string,
    freezeAvailable: boolean,
) {
    const k = keys(userId);
    localStorage.setItem(k.lastActive, lastActive);
    localStorage.setItem(k.freeze, String(freezeAvailable));
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Call after every quest completion.
 * Updates streak in DB and freeze/date in localStorage.
 */
export async function checkAndUpdateStreak(userId: string): Promise<StreakStatus> {
    const now = new Date();

    // Load current streak count from DB
    const { data: profile } = await supabase
        .from('profiles')
        .select('streak')
        .eq('id', userId)
        .single();

    const currentStreak: number = (profile as any)?.streak ?? 0;
    const { lastActiveDate: lastActiveStr, freezeAvailable } = loadLocalStreak(userId);
    const lastActive = lastActiveStr ? new Date(lastActiveStr) : null;

    // Already active today — nothing to do
    if (lastActive && isSameDay(lastActive, now)) {
        return {
            current: currentStreak, lastActiveDate: lastActiveStr,
            isFrozen: false, freezeAvailable,
            milestoneReached: null, bonusXP: 0,
        };
    }

    let newStreak = currentStreak;
    let isFrozen = false;
    let newFreezeAvailable = freezeAvailable;

    if (!lastActive) {
        newStreak = 1;
    } else if (isYesterday(lastActive, now)) {
        newStreak = currentStreak + 1;
    } else {
        // Missed day(s)
        if (freezeAvailable) {
            isFrozen = true;
            newFreezeAvailable = false; // consume the freeze
            // streak stays the same — don't increment
        } else {
            newStreak = 1; // reset
        }
    }

    // Milestone check
    let milestoneReached: number | null = null;
    let bonusXP = 0;
    const milestoneEntries = Object.entries(MILESTONE_REWARDS) as [string, number][];
    for (const [dayStr, xp] of milestoneEntries) {
        if (newStreak === Number(dayStr)) {
            milestoneReached = Number(dayStr);
            bonusXP = xp;
        }
    }

    // Grant a new freeze at every 7-day milestone (if not currently frozen)
    if (newStreak > 0 && newStreak % 7 === 0 && !isFrozen) {
        newFreezeAvailable = true;
    }

    // Persist streak count to DB
    await supabase
        .from('profiles')
        .update({ streak: newStreak } as any)
        .eq('id', userId);

    // Persist date + freeze to localStorage
    const nowISO = now.toISOString();
    saveLocalStreak(userId, nowISO, newFreezeAvailable);

    // Award milestone XP via existing xp column
    if (bonusXP > 0) {
        const { data: p } = await supabase
            .from('profiles')
            .select('xp')
            .eq('id', userId)
            .single();
        if (p) {
            await supabase
                .from('profiles')
                .update({ xp: ((p as any).xp ?? 0) + bonusXP } as any)
                .eq('id', userId);
        }
    }

    return {
        current: newStreak,
        lastActiveDate: nowISO,
        isFrozen,
        freezeAvailable: newFreezeAvailable,
        milestoneReached,
        bonusXP,
    };
}

/** Read streak status without modifying it. */
export async function getStreakStatus(userId: string): Promise<StreakStatus> {
    const { data: profile } = await supabase
        .from('profiles')
        .select('streak')
        .eq('id', userId)
        .single();

    const { lastActiveDate, freezeAvailable } = loadLocalStreak(userId);

    return {
        current: (profile as any)?.streak ?? 0,
        lastActiveDate,
        isFrozen: false,
        freezeAvailable,
        milestoneReached: null,
        bonusXP: 0,
    };
}

/** Manually activate streak freeze from the UI. */
export async function useStreakFreeze(userId: string): Promise<boolean> {
    const { freezeAvailable, lastActiveDate } = loadLocalStreak(userId);
    if (!freezeAvailable) return false;
    saveLocalStreak(userId, lastActiveDate ?? new Date().toISOString(), false);
    return true;
}
