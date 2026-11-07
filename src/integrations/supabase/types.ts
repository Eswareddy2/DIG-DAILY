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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          auto_collected: boolean
          category_slug: string
          content: string | null
          content_hi: string | null
          created_at: string
          dedupe_hash: string
          featured: boolean
          id: string
          image_url: string | null
          is_breaking: boolean
          original_url: string | null
          published_at: string
          slug: string
          source_id: string | null
          source_name: string
          status: string
          summary: string | null
          summary_hi: string | null
          title: string
          title_hi: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          auto_collected?: boolean
          category_slug?: string
          content?: string | null
          content_hi?: string | null
          created_at?: string
          dedupe_hash: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_breaking?: boolean
          original_url?: string | null
          published_at?: string
          slug: string
          source_id?: string | null
          source_name?: string
          status?: string
          summary?: string | null
          summary_hi?: string | null
          title: string
          title_hi?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          auto_collected?: boolean
          category_slug?: string
          content?: string | null
          content_hi?: string | null
          created_at?: string
          dedupe_hash?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          is_breaking?: boolean
          original_url?: string | null
          published_at?: string
          slug?: string
          source_id?: string | null
          source_name?: string
          status?: string
          summary?: string | null
          summary_hi?: string | null
          title?: string
          title_hi?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          id: string
          keywords: string[]
          name: string
          name_hi: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          keywords?: string[]
          name: string
          name_hi?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          keywords?: string[]
          name?: string
          name_hi?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string
          id?: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      collection_logs: {
        Row: {
          error_count: number
          finished_at: string | null
          id: string
          items_added: number
          items_found: number
          message: string | null
          sources_checked: number
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          error_count?: number
          finished_at?: string | null
          id?: string
          items_added?: number
          items_found?: number
          message?: string | null
          sources_checked?: number
          started_at?: string
          status?: string
          trigger?: string
        }
        Update: {
          error_count?: number
          finished_at?: string | null
          id?: string
          items_added?: number
          items_found?: number
          message?: string | null
          sources_checked?: number
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: []
      }
      collector_state: {
        Row: {
          id: string
          last_run_at: string | null
          locked_until: string | null
          note: string | null
          paused: boolean
        }
        Insert: {
          id: string
          last_run_at?: string | null
          locked_until?: string | null
          note?: string | null
          paused?: boolean
        }
        Update: {
          id?: string
          last_run_at?: string | null
          locked_until?: string | null
          note?: string | null
          paused?: boolean
        }
        Relationships: []
      }
      cron_tokens: {
        Row: {
          created_at: string
          id: boolean
          token: string
        }
        Insert: {
          created_at?: string
          id?: boolean
          token: string
        }
        Update: {
          created_at?: string
          id?: boolean
          token?: string
        }
        Relationships: []
      }
      digests: {
        Row: {
          article_ids: string[]
          created_at: string
          digest_date: string
          id: string
          intro: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          article_ids?: string[]
          created_at?: string
          digest_date: string
          id?: string
          intro?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          article_ids?: string[]
          created_at?: string
          digest_date?: string
          id?: string
          intro?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          article_id: string
          id: string
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          article_id: string
          id?: string
          referrer?: string | null
          viewed_at?: string
        }
        Update: {
          article_id?: string
          id?: string
          referrer?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          path: string
          visit_day: string
          visited_at: string
          visitor_id: string
        }
        Insert: {
          path: string
          visit_day?: string
          visited_at?: string
          visitor_id: string
        }
        Update: {
          path?: string
          visit_day?: string
          visited_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string
          default_category: string | null
          enabled: boolean
          feed_url: string
          id: string
          kind: string
          last_error: string | null
          last_fetched_at: string | null
          last_status: string | null
          logo_url: string | null
          name: string
          site_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_category?: string | null
          enabled?: boolean
          feed_url: string
          id?: string
          kind?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          logo_url?: string | null
          name: string
          site_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_category?: string | null
          enabled?: boolean
          feed_url?: string
          id?: string
          kind?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          logo_url?: string | null
          name?: string
          site_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_collect_hook: { Args: never; Returns: undefined }
      get_admin_site_analytics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
