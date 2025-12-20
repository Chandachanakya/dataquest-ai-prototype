import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  total_xp: number;
  streak: number;
  badges: string[];
  completed_quests: number;
  learning_style: 'visual' | 'hands-on' | 'reading';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  last_quest_date?: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check streak status and reset if user missed a day
  const checkAndResetStreak = async (): Promise<number> => {
    if (!user || !profile) return 0;

    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = profile.last_quest_date;

    // No previous quest - streak starts at 0, will become 1 on first completion
    if (!lastQuestDate) return 0;

    const lastDate = new Date(lastQuestDate).toISOString().split('T')[0];
    
    // Same day - streak unchanged
    if (lastDate === today) return profile.streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Yesterday - streak continues (will increment on next completion)
    if (lastDate === yesterdayStr) return profile.streak;

    // Missed more than one day - reset streak to 0
    if (profile.streak > 0) {
      await supabase
        .from('profiles')
        .update({ streak: 0 })
        .eq('id', user.id);
      
      setProfile(prev => prev ? { ...prev, streak: 0 } : null);
      return 0;
    }

    return 0;
  };

  // Update streak when completing a quest
  const updateStreak = async (): Promise<{ error: Error | null }> => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = profile.last_quest_date;

    let newStreak = profile.streak;

    if (!lastQuestDate) {
      // First quest ever - start streak at 1
      newStreak = 1;
    } else {
      const lastDate = new Date(lastQuestDate).toISOString().split('T')[0];

      if (lastDate === today) {
        // Already completed quest today - don't change streak
        return { error: null };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        // Consecutive day - increment streak
        newStreak = profile.streak + 1;
      } else {
        // Missed days - reset streak to 1
        newStreak = 1;
      }
    }

    return updateProfile({
      streak: newStreak,
      last_quest_date: today,
    });
  };

  const updateProfile = async (updates: Partial<Profile & { last_quest_date?: string | null }>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      // Refresh profile after update
      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const addXP = async (xpAmount: number) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const XP_PER_LEVEL = 1000;
    let newXP = profile.xp + xpAmount;
    const newTotalXP = profile.total_xp + xpAmount;
    let newLevel = profile.level;

    // Handle multiple level-ups if XP gain is large
    while (newXP >= XP_PER_LEVEL) {
      newLevel++;
      newXP -= XP_PER_LEVEL;
    }

    return updateProfile({
      xp: newXP,
      total_xp: newTotalXP,
      level: newLevel,
    });
  };

  return { 
    profile, 
    loading, 
    updateProfile, 
    addXP, 
    updateStreak,
    checkAndResetStreak,
    refetch: fetchProfile 
  };
};
