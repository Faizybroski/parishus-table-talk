export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          password_hash: string
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      crossed_paths: {
        Row: {
          id: string
          is_active: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          matched_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          matched_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          matched_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crossed_paths_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crossed_paths_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crossed_paths_log: {
        Row: {
          created_at: string
          cross_count: number | null
          date_crossed: string
          id: string
          location_lat: number | null
          location_lng: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          updated_at: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          cross_count?: number | null
          date_crossed?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          restaurant_id?: string | null
          restaurant_name?: string | null
          updated_at?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          cross_count?: number | null
          date_crossed?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          restaurant_id?: string | null
          restaurant_name?: string | null
          updated_at?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crossed_paths_log_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crossed_paths_log_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_invitations: {
        Row: {
          event_id: string
          id: string
          invitation_status: string | null
          invited_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          invitation_status?: string | null
          invited_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          invitation_status?: string | null
          invited_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          admin_notification_email: string | null
          auto_suggest_crossed_paths: boolean | null
          cover_photo_url: string | null
          created_at: string
          creator_id: string
          date_time: string
          description: string | null
          dietary_theme:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          dining_style: Database["public"]["Enums"]["dining_style"] | null
          guest_invitation_type: string | null
          id: string
          is_mystery_dinner: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_attendees: number | null
          name: string
          restaurant_id: string | null
          rsvp_deadline: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          admin_notification_email?: string | null
          auto_suggest_crossed_paths?: boolean | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id: string
          date_time: string
          description?: string | null
          dietary_theme?:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          dining_style?: Database["public"]["Enums"]["dining_style"] | null
          guest_invitation_type?: string | null
          id?: string
          is_mystery_dinner?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_attendees?: number | null
          name: string
          restaurant_id?: string | null
          rsvp_deadline?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          admin_notification_email?: string | null
          auto_suggest_crossed_paths?: boolean | null
          cover_photo_url?: string | null
          created_at?: string
          creator_id?: string
          date_time?: string
          description?: string | null
          dietary_theme?:
            | Database["public"]["Enums"]["dietary_preference"]
            | null
          dining_style?: Database["public"]["Enums"]["dining_style"] | null
          guest_invitation_type?: string | null
          id?: string
          is_mystery_dinner?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_attendees?: number | null
          name?: string
          restaurant_id?: string | null
          rsvp_deadline?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          flagged_users: string[] | null
          id: string
          is_addressed: boolean | null
          rating: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          flagged_users?: string[] | null
          id?: string
          is_addressed?: boolean | null
          rating?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          flagged_users?: string[] | null
          id?: string
          is_addressed?: boolean | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_crossed_paths_tracking: boolean | null
          created_at: string
          dietary_preferences:
            | Database["public"]["Enums"]["dietary_preference"][]
            | null
          dining_style: Database["public"]["Enums"]["dining_style"] | null
          email: string
          first_name: string | null
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          id: string
          is_suspended: boolean | null
          job_title: string | null
          last_name: string | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          onboarding_completed: boolean | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_crossed_paths_tracking?: boolean | null
          created_at?: string
          dietary_preferences?:
            | Database["public"]["Enums"]["dietary_preference"][]
            | null
          dining_style?: Database["public"]["Enums"]["dining_style"] | null
          email: string
          first_name?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          id?: string
          is_suspended?: boolean | null
          job_title?: string | null
          last_name?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          onboarding_completed?: boolean | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_crossed_paths_tracking?: boolean | null
          created_at?: string
          dietary_preferences?:
            | Database["public"]["Enums"]["dietary_preference"][]
            | null
          dining_style?: Database["public"]["Enums"]["dining_style"] | null
          email?: string
          first_name?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          id?: string
          is_suspended?: boolean | null
          job_title?: string | null
          last_name?: string | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          onboarding_completed?: boolean | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reservation_status: string
          reservation_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reservation_status?: string
          reservation_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reservation_status?: string
          reservation_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_visits: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          user_id: string
          visited_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          restaurant_id?: string | null
          restaurant_name?: string | null
          user_id: string
          visited_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          restaurant_id?: string | null
          restaurant_name?: string | null
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          city: string
          country: string
          created_at: string
          creator_id: string
          full_address: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_province: string
          updated_at: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          creator_id: string
          full_address: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_province: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          creator_id?: string
          full_address?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_province?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_running_late: boolean | null
          response_status: Database["public"]["Enums"]["rsvp_status"] | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_running_late?: boolean | null
          response_status?: Database["public"]["Enums"]["rsvp_status"] | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_running_late?: boolean | null
          response_status?: Database["public"]["Enums"]["rsvp_status"] | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      admin_role: "super_admin" | "moderator"
      dietary_preference:
        | "vegetarian"
        | "vegan"
        | "gluten_free"
        | "dairy_free"
        | "keto"
        | "paleo"
        | "halal"
        | "kosher"
        | "no_restrictions"
      dining_style:
        | "adventurous"
        | "foodie_enthusiast"
        | "local_lover"
        | "comfort_food"
        | "health_conscious"
        | "social_butterfly"
      event_status: "active" | "cancelled" | "completed"
      gender_identity: "male" | "female" | "non_binary" | "prefer_not_to_say"
      notification_type:
        | "rsvp_confirmation"
        | "event_reminder"
        | "crossed_paths_match"
        | "feedback_request"
        | "general"
        | "rsvp_received"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      rsvp_status: "yes" | "no" | "maybe" | "pending"
      subscription_plan: "monthly" | "yearly"
      user_role: "user" | "admin" | "superadmin"
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
      admin_role: ["super_admin", "moderator"],
      dietary_preference: [
        "vegetarian",
        "vegan",
        "gluten_free",
        "dairy_free",
        "keto",
        "paleo",
        "halal",
        "kosher",
        "no_restrictions",
      ],
      dining_style: [
        "adventurous",
        "foodie_enthusiast",
        "local_lover",
        "comfort_food",
        "health_conscious",
        "social_butterfly",
      ],
      event_status: ["active", "cancelled", "completed"],
      gender_identity: ["male", "female", "non_binary", "prefer_not_to_say"],
      notification_type: [
        "rsvp_confirmation",
        "event_reminder",
        "crossed_paths_match",
        "feedback_request",
        "general",
        "rsvp_received",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      rsvp_status: ["yes", "no", "maybe", "pending"],
      subscription_plan: ["monthly", "yearly"],
      user_role: ["user", "admin", "superadmin"],
    },
  },
} as const
