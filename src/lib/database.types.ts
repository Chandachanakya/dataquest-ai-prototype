export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          last_quest_date: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar?: string;
          level?: number;
          xp?: number;
          total_xp?: number;
          streak?: number;
          badges?: string[];
          completed_quests?: number;
          learning_style?: 'visual' | 'hands-on' | 'reading';
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          topics?: string[];
          last_quest_date?: string | null;
        };
        Update: {
          username?: string;
          avatar?: string;
          level?: number;
          xp?: number;
          total_xp?: number;
          streak?: number;
          badges?: string[];
          completed_quests?: number;
          learning_style?: 'visual' | 'hands-on' | 'reading';
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          topics?: string[];
          last_quest_date?: string | null;
        };
      };
      user_course_progress: {
        Row: {
          user_id: string;
          currentLevel: number;
          totalXP: number;
          completedModules: number[];
          completedChallenges: string[];
          completedBossFights: number[];
        };
        Insert: {
          user_id: string;
          currentLevel?: number;
          totalXP?: number;
          completedModules?: number[];
          completedChallenges?: string[];
          completedBossFights?: number[];
        };
        Update: {
          currentLevel?: number;
          totalXP?: number;
          completedModules?: number[];
          completedChallenges?: string[];
          completedBossFights?: number[];
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}