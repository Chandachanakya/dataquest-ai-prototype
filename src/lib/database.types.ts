export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_id: string
          description: string | null
          icon: string | null
          id: string
          name: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          avatar: string | null
          challenge_id: string
          completed_at: string | null
          score: number | null
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          challenge_id: string
          completed_at?: string | null
          score?: number | null
          user_id: string
          username: string
        }
        Update: {
          avatar?: string | null
          challenge_id?: string
          completed_at?: string | null
          score?: number | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          creator_id: string
          creator_name: string
          description: string | null
          expires_at: string
          id: string
          quest_id: string
          target_score: number
          title: string
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          creator_name: string
          description?: string | null
          expires_at: string
          id?: string
          quest_id: string
          target_score: number
          title: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          creator_name?: string
          description?: string | null
          expires_at?: string
          id?: string
          quest_id?: string
          target_score?: number
          title?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          completed_modules: number | null
          course_id: string
          created_at: string | null
          id: string
          last_accessed_at: string | null
          total_modules: number
          user_id: string
        }
        Insert: {
          completed_modules?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          total_modules: number
          user_id: string
        }
        Update: {
          completed_modules?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          total_modules?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          avatar: string | null
          content: string
          created_at: string | null
          id: string
          likes: number | null
          title: string
          topic: string
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes?: number | null
          title: string
          topic: string
          user_id: string
          username: string
        }
        Update: {
          avatar?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes?: number | null
          title?: string
          topic?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          avatar: string | null
          content: string
          created_at: string | null
          id: string
          likes: number | null
          post_id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id: string
          user_id: string
          username: string
        }
        Update: {
          avatar?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          badges: string[] | null
          completed_quests: number | null
          created_at: string | null
          difficulty: string | null
          id: string
          last_quest_date: string | null
          learning_style: string | null
          level: number | null
          streak: number | null
          topics: string[] | null
          total_xp: number | null
          ui_flags: Json | null
          updated_at: string | null
          username: string
          xp: number | null
        }
        Insert: {
          avatar?: string | null
          badges?: string[] | null
          completed_quests?: number | null
          created_at?: string | null
          difficulty?: string | null
          id: string
          last_quest_date?: string | null
          learning_style?: string | null
          level?: number | null
          streak?: number | null
          topics?: string[] | null
          total_xp?: number | null
          ui_flags?: Json | null
          updated_at?: string | null
          username: string
          xp?: number | null
        }
        Update: {
          avatar?: string | null
          badges?: string[] | null
          completed_quests?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          last_quest_date?: string | null
          learning_style?: string | null
          level?: number | null
          streak?: number | null
          topics?: string[] | null
          total_xp?: number | null
          ui_flags?: Json | null
          updated_at?: string | null
          username?: string
          xp?: number | null
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: number
          lesson_id: number
          module_id: number
          quiz_score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: number
          lesson_id: number
          module_id: number
          quiz_score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: number
          lesson_id?: number
          module_id?: number
          quiz_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          attempts: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          quest_id: string
          score: number | null
          time_spent: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          attempts?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quest_id: string
          score?: number | null
          time_spent?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          attempts?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          quest_id?: string
          score?: number | null
          time_spent?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_attempts: {
        Row: {
          id: string
          user_id: string
          quest_id: string
          started_at: string
          completed_at: string | null
          score: number | null
          completion_time: number | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          quest_id: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          completion_time?: number | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          quest_id?: string
          started_at?: string
          completed_at?: string | null
          score?: number | null
          completion_time?: number | null
          status?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_logs: {
        Row: {
          id: string
          user_id: string
          state_detected: string
          action_taken: string
          reason: string
          metadata: Json
          timestamp: string
          created_at: string | null
          confidence_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          state_detected: string
          action_taken: string
          reason: string
          metadata?: Json
          timestamp?: string
          created_at?: string | null
          confidence_score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          state_detected?: string
          action_taken?: string
          reason?: string
          metadata?: Json
          timestamp?: string
          created_at?: string | null
          confidence_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_states: {
        Row: {
          id: number
          user_id: string
          state: string
          reason: string
          computed_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          state: string
          reason: string
          computed_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          state?: string
          reason?: string
          computed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_mapping: {
        Row: {
          id: number
          learner_state: string
          action_type: string
          action_payload: Json | null
          priority: number
          description: string | null
        }
        Insert: {
          id?: number
          learner_state: string
          action_type: string
          action_payload?: Json | null
          priority: number
          description?: string | null
        }
        Update: {
          id?: number
          learner_state?: string
          action_type?: string
          action_payload?: Json | null
          priority?: number
          description?: string | null
        }
        Relationships: []
      }
      action_logs: {
        Row: {
          id: number
          user_id: string
          learner_state: string
          action_type: string
          reason: string
          executed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          learner_state: string
          action_type: string
          reason: string
          executed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          learner_state?: string
          action_type?: string
          reason?: string
          executed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          id: string
          title: string
          description: string | null
          difficulty: string
          topic: string
          xp: number
          type: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          difficulty: string
          topic: string
          xp?: number
          type: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          difficulty?: string
          topic?: string
          xp?: number
          type?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      learner_analytics: {
        Row: {
          user_id: string | null
          last_active_at: string | null
          activity_frequency: number | null
          average_score: number | null
          total_attempts: number | null
          weekly_xp_earned: number | null
        }
        Relationships: []
      }

    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
