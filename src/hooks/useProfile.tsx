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
        const profileData = data as Profile & { last_quest_date?: string | null };
        
        // Check and reset streak if user missed a day
        const today = new Date().toISOString().split('T')[0];
        const lastQuestDate = profileData.last_quest_date;
        
        if (lastQuestDate && profileData.streak > 0) {
          const lastQuestDateStr = new Date(lastQuestDate).toISOString().split('T')[0];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          // If last quest was more than 1 day ago (not yesterday and not today), reset streak
          if (lastQuestDateStr !== today && lastQuestDateStr !== yesterdayStr) {
            // Reset streak to 0
            const { data: updatedData } = await supabase
              .from('profiles')
              .update({ streak: 0 })
              .eq('id', user.id)
              .select()
              .single();
            
            if (updatedData) {
              profileData.streak = 0;
            }
          }
        }
        
        setProfile(profileData as Profile);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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

    const newXP = profile.xp + xpAmount;
    const newTotalXP = profile.total_xp + xpAmount;
    
    // Level up logic: Only increase level when XP reaches exactly the threshold (1000 XP per level)
    const xpPerLevel = 1000;
    let newLevel = profile.level;
    let remainingXP = newXP;

    // Only level up if XP reaches or exceeds the threshold
    if (newXP >= xpPerLevel) {
      newLevel++;
      remainingXP = newXP - xpPerLevel;
    } else {
      remainingXP = newXP;
    }

    return updateProfile({
      xp: remainingXP,
      total_xp: newTotalXP,
      level: newLevel,
    });
  };

  return { profile, loading, updateProfile, addXP, refetch: fetchProfile };
};
