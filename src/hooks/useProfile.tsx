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

  const updateProfile = async (updates: Partial<Profile>) => {
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

    const newXP = profile.xp + xpAmount;
    const newTotalXP = profile.total_xp + xpAmount;
    
    // Level up logic: 1000 XP per level
    const xpPerLevel = 1000;
    let newLevel = profile.level;
    let remainingXP = newXP;

    while (remainingXP >= xpPerLevel) {
      newLevel++;
      remainingXP -= xpPerLevel;
    }

    return updateProfile({
      xp: remainingXP,
      total_xp: newTotalXP,
      level: newLevel,
    });
  };

  return { profile, loading, updateProfile, addXP, refetch: fetchProfile };
};
