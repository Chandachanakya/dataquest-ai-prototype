import { useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error };
      }

      await fetchProfile();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, fetchProfile]);

  const checkAndResetStreak = useCallback(async () => {
    if (!user || !profile || !profile.last_quest_date) return;

    const today = new Date();
    const lastQuestDate = new Date(profile.last_quest_date);

    const diffTime = Math.abs(today.getTime() - lastQuestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      await updateProfile({ streak: 0 });
    }
  }, [user, profile, updateProfile]);

  const updateStreak = useCallback(async () => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = profile.last_quest_date;

    let newStreak = profile.streak;

    if (!lastQuestDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastQuestDate).toISOString().split('T')[0];

      if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
          newStreak = profile.streak + 1;
        } else {
          newStreak = 1;
        }
      }
    }

    return updateProfile({
      streak: newStreak,
      last_quest_date: today,
    });
  }, [user, profile, updateProfile]);

  const addXP = useCallback(async (xpAmount: number) => {
    if (!user || !profile) return { error: new Error('Not authenticated') };

    const XP_PER_LEVEL = 1000;
    let newXP = profile.xp + xpAmount;
    const newTotalXP = profile.total_xp + xpAmount;
    let newLevel = profile.level;

    while (newXP >= XP_PER_LEVEL) {
      newLevel++;
      newXP -= XP_PER_LEVEL;
    }

    return updateProfile({
      xp: newXP,
      total_xp: newTotalXP,
      level: newLevel,
    });
  }, [user, profile, updateProfile]);

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