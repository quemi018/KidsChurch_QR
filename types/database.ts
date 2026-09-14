// Generated from the Supabase project schema (Phase 2 migrations).
// Regenerate after every migration: see README "Regenerating database types".
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attendance: {
        Row: {
          checked_in_at: string;
          checked_in_by: string;
          child_age_snapshot: number;
          child_gender_snapshot: string;
          child_id: string;
          child_name_snapshot: string;
          created_at: string;
          guardian_contact_snapshot: string;
          guardian_id: string;
          guardian_name_snapshot: string;
          guardian_relationship_snapshot: string | null;
          id: string;
          session_id: string;
        };
        Insert: {
          checked_in_at?: string;
          checked_in_by: string;
          child_age_snapshot: number;
          child_gender_snapshot: string;
          child_id: string;
          child_name_snapshot: string;
          created_at?: string;
          guardian_contact_snapshot: string;
          guardian_id: string;
          guardian_name_snapshot: string;
          guardian_relationship_snapshot?: string | null;
          id?: string;
          session_id: string;
        };
        Update: {
          checked_in_at?: string;
          checked_in_by?: string;
          child_age_snapshot?: number;
          child_gender_snapshot?: string;
          child_id?: string;
          child_name_snapshot?: string;
          created_at?: string;
          guardian_contact_snapshot?: string;
          guardian_id?: string;
          guardian_name_snapshot?: string;
          guardian_relationship_snapshot?: string | null;
          id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_checked_in_by_fkey";
            columns: ["checked_in_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "church_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      children: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          birthday: string;
          created_at: string;
          full_name: string;
          gender: string;
          guardian_id: string;
          id: string;
          is_active: boolean;
          qr_token: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          birthday: string;
          created_at?: string;
          full_name: string;
          gender: string;
          guardian_id: string;
          id?: string;
          is_active?: boolean;
          qr_token?: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          birthday?: string;
          created_at?: string;
          full_name?: string;
          gender?: string;
          guardian_id?: string;
          id?: string;
          is_active?: boolean;
          qr_token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_archived_by_fkey";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "children_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      church_sessions: {
        Row: {
          closed_at: string | null;
          closed_by: string | null;
          created_at: string;
          id: string;
          name: string;
          opened_at: string | null;
          opened_by: string | null;
          service_time: string | null;
          session_date: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          opened_at?: string | null;
          opened_by?: string | null;
          service_time?: string | null;
          session_date: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          opened_at?: string | null;
          opened_by?: string | null;
          service_time?: string | null;
          session_date?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "church_sessions_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "church_sessions_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          guardian_relationship: string | null;
          guardian_relationship_other: string | null;
          home_city: string | null;
          id: string;
          is_active: boolean;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          guardian_relationship?: string | null;
          guardian_relationship_other?: string | null;
          home_city?: string | null;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          guardian_relationship?: string | null;
          guardian_relationship_other?: string | null;
          home_city?: string | null;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      registration_stations: {
        Row: {
          activated_by: string;
          created_at: string;
          deactivated_at: string | null;
          deactivated_by: string | null;
          id: string;
          is_active: boolean;
          last_used_at: string | null;
          name: string;
          station_token_hash: string;
        };
        Insert: {
          activated_by: string;
          created_at?: string;
          deactivated_at?: string | null;
          deactivated_by?: string | null;
          id?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          name: string;
          station_token_hash: string;
        };
        Update: {
          activated_by?: string;
          created_at?: string;
          deactivated_at?: string | null;
          deactivated_by?: string | null;
          id?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          name?: string;
          station_token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_stations_activated_by_fkey";
            columns: ["activated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_stations_deactivated_by_fkey";
            columns: ["deactivated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
