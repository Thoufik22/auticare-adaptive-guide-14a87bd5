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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_history: {
        Row: {
          created_at: string
          fused_score: number
          id: string
          metadata: Json | null
          ml_score: number | null
          questionnaire_score: number
          role: string
          severity: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          fused_score: number
          id?: string
          metadata?: Json | null
          ml_score?: number | null
          questionnaire_score: number
          role: string
          severity: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          fused_score?: number
          id?: string
          metadata?: Json | null
          ml_score?: number | null
          questionnaire_score?: number
          role?: string
          severity?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      patient_reports: {
        Row: {
          answers: Json
          application_number: string
          created_at: string
          home_language: string | null
          id: string
          patient_age: string
          patient_name: string
          problems_faced: string | null
          pronoun: string | null
          video_url: string | null
        }
        Insert: {
          answers: Json
          application_number: string
          created_at?: string
          home_language?: string | null
          id?: string
          patient_age: string
          patient_name: string
          problems_faced?: string | null
          pronoun?: string | null
          video_url?: string | null
        }
        Update: {
          answers?: Json
          application_number?: string
          created_at?: string
          home_language?: string | null
          id?: string
          patient_age?: string
          patient_name?: string
          problems_faced?: string | null
          pronoun?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          id: string
          language: string | null
          name: string
          pronoun: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          id?: string
          language?: string | null
          name: string
          pronoun?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          id?: string
          language?: string | null
          name?: string
          pronoun?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_achievements: {
        Row: {
          content: Json
          created_at: string
          expires_at: string | null
          id: string
          is_public: boolean
          share_token: string
          title: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          share_token?: string
          title: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          is_public?: boolean
          share_token?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_assessment_data: {
        Row: {
          assessment_complete: boolean | null
          child_data: Json | null
          created_at: string
          email: string
          excel_data: Json | null
          fused_score: number | null
          id: string
          last_assessment_answers: Json | null
          last_score: number | null
          model_score: number | null
          patient_id: string
          questionnaire_score: number | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_complete?: boolean | null
          child_data?: Json | null
          created_at?: string
          email: string
          excel_data?: Json | null
          fused_score?: number | null
          id?: string
          last_assessment_answers?: Json | null
          last_score?: number | null
          model_score?: number | null
          patient_id: string
          questionnaire_score?: number | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_complete?: boolean | null
          child_data?: Json | null
          created_at?: string
          email?: string
          excel_data?: Json | null
          fused_score?: number | null
          id?: string
          last_assessment_answers?: Json | null
          last_score?: number | null
          model_score?: number | null
          patient_id?: string
          questionnaire_score?: number | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
