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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      communities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          slug: string
          updated_at: string
          visibility: Database["public"]["Enums"]["community_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          slug: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["community_visibility"]
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["community_role"]
          status: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["community_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["community_role"]
          status?: Database["public"]["Enums"]["community_member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_pitches: {
        Row: {
          community_id: string
          created_at: string
          id: string
          pitch_id: string
          posted_by: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          pitch_id: string
          posted_by: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          pitch_id?: string
          posted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_pitches_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_pitches_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_bookmarks: {
        Row: {
          created_at: string
          id: string
          pitch_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pitch_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pitch_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_bookmarks_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_ratings: {
        Row: {
          created_at: string
          id: string
          pitch_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pitch_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pitch_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_ratings_pitch_id_fkey"
            columns: ["pitch_id"]
            isOneToOne: false
            referencedRelation: "pitches"
            referencedColumns: ["id"]
          },
        ]
      }
      pitches: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          details: string | null
          expires_at: string | null
          id: string
          industry: string
          is_public: boolean
          links: string | null
          share_token: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          description?: string | null
          details?: string | null
          expires_at?: string | null
          id?: string
          industry: string
          is_public?: boolean
          links?: string | null
          share_token?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          details?: string | null
          expires_at?: string | null
          id?: string
          industry?: string
          is_public?: boolean
          links?: string | null
          share_token?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          personality: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          personality?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          personality?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      temp_pitches: {
        Row: {
          claim_email: string | null
          content: Json
          created_at: string
          description: string | null
          details: string | null
          expires_at: string
          id: string
          industry: string
          links: string | null
          share_token: string
          title: string
        }
        Insert: {
          claim_email?: string | null
          content: Json
          created_at?: string
          description?: string | null
          details?: string | null
          expires_at?: string
          id?: string
          industry: string
          links?: string | null
          share_token?: string
          title: string
        }
        Update: {
          claim_email?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          details?: string | null
          expires_at?: string
          id?: string
          industry?: string
          links?: string | null
          share_token?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_temp_pitch: { Args: { _token: string }; Returns: string }
      claim_temp_pitches_by_email: { Args: never; Returns: number }
      cleanup_expired_pitches: { Args: never; Returns: undefined }
      cleanup_expired_temp_pitches: { Args: never; Returns: undefined }
      community_role_of: {
        Args: { _community: string; _user: string }
        Returns: Database["public"]["Enums"]["community_role"]
      }
      get_temp_pitch: {
        Args: { _token: string }
        Returns: {
          content: Json
          created_at: string
          description: string
          details: string
          expires_at: string
          id: string
          industry: string
          links: string
          share_token: string
          title: string
        }[]
      }
      is_community_banned: {
        Args: { _community: string; _user: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community: string; _user: string }
        Returns: boolean
      }
      is_community_staff: {
        Args: { _community: string; _user: string }
        Returns: boolean
      }
      join_community: {
        Args: { _community: string }
        Returns: Database["public"]["Enums"]["community_member_status"]
      }
      remove_member: {
        Args: { _community: string; _user: string }
        Returns: undefined
      }
      set_member_role: {
        Args: {
          _community: string
          _role: Database["public"]["Enums"]["community_role"]
          _user: string
        }
        Returns: undefined
      }
      set_member_status: {
        Args: {
          _community: string
          _status: Database["public"]["Enums"]["community_member_status"]
          _user: string
        }
        Returns: undefined
      }
      set_pitch_expiry: {
        Args: { _expires_at: string; _pitch_id: string }
        Returns: undefined
      }
      set_temp_pitch_email: {
        Args: { _email: string; _token: string }
        Returns: undefined
      }
    }
    Enums: {
      community_member_status: "active" | "pending" | "banned"
      community_role: "owner" | "leader" | "member"
      community_visibility: "public" | "private" | "global"
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
    Enums: {
      community_member_status: ["active", "pending", "banned"],
      community_role: ["owner", "leader", "member"],
      community_visibility: ["public", "private", "global"],
    },
  },
} as const
