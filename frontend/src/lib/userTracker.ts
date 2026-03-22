import { supabase } from '@/integrations/supabase/client';

/**
 * Core User Tracking for Impact Measurement (Phase 1)
 * Records cohort retention metrics and processes delayed intervention outcomes (Phase 3).
 * Should be called on application launch or login.
 */
export async function trackUserSession(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_active_date, last_active_date, total_active_days, retained_after_7_days, retained_after_14_days, xp')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.warn("trackUserSession: Could not fetch profile", error);
      return;
    }

    const updates: Record<string, any> = {};
    const now = new Date();
    
    // 1. Initialize first_active_date if missing
    if (!profile.first_active_date) {
      updates.first_active_date = now.toISOString();
      updates.total_active_days = 1;
    } else {
      // 2. Check daily transitions
      const firstActiveDate = new Date(profile.first_active_date);
      const daysSinceFirstActive = (now.getTime() - firstActiveDate.getTime()) / (1000 * 60 * 60 * 24);

      // Check Retention Cohort Milestones
      if (daysSinceFirstActive >= 7 && !profile.retained_after_7_days) {
        updates.retained_after_7_days = true;
      }
      if (daysSinceFirstActive >= 14 && !profile.retained_after_14_days) {
        updates.retained_after_14_days = true;
      }

      // Increment total active days if it's a new calendar day
      if (profile.last_active_date) {
        const lastActive = new Date(profile.last_active_date);
        if (lastActive.getDate() !== now.getDate() || lastActive.getMonth() !== now.getMonth() || lastActive.getFullYear() !== now.getFullYear()) {
          updates.total_active_days = (profile.total_active_days || 0) + 1;
        }
      }
    }

    updates.last_active_date = now.toISOString();

    // Persist updates to profile
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', userId);
    }

    // 3. Process Pending Intervention Outcomes (24h trailing data)
    await processPendingInterventionOutcomes(userId, profile.xp || 0);

  } catch (err) {
    console.error("Failed to track user session", err);
  }
}

/**
 * Searches for intervention outcomes older than 24 hours that haven't been resolved,
 * and updates them with the final XP gain and session completion status.
 */
async function processPendingInterventionOutcomes(userId: string, currentXP: number) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingOutcomes } = await supabase
    .from('intervention_outcomes')
    .select('id, xp_before')
    .eq('user_id', userId)
    .is('xp_after_24h', null)
    .lt('created_at', twentyFourHoursAgo);

  if (!pendingOutcomes || pendingOutcomes.length === 0) return;

  for (const outcome of pendingOutcomes) {
    const xp_change = currentXP - outcome.xp_before;
    await supabase.from('intervention_outcomes')
      .update({
        xp_after_24h: currentXP,
        xp_change: xp_change,
        next_session_completed: true // Simplified: user logged in >24h later, so they completed a subsequent session
      })
      .eq('id', outcome.id);
  }
}
