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
      article_companies: {
        Row: {
          article_id: string
          company_id: string
        }
        Insert: {
          article_id: string
          company_id: string
        }
        Update: {
          article_id?: string
          company_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_companies_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "directory_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      article_industries: {
        Row: {
          article_id: string
          industry_id: string
        }
        Insert: {
          article_id: string
          industry_id: string
        }
        Update: {
          article_id?: string
          industry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_industries_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "directory_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
        ]
      }
      article_people: {
        Row: {
          article_id: string
          person_id: string
        }
        Insert: {
          article_id: string
          person_id: string
        }
        Update: {
          article_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_people_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "directory_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      article_views: {
        Row: {
          article_id: string
          created_at: string
          id: string
          viewer_hash: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          viewer_hash?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          viewer_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "cna_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      cna_articles: {
        Row: {
          body_markdown: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string | null
          source_id: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          vertical: Database["public"]["Enums"]["article_vertical"]
          what_happened: string | null
          what_to_do: string | null
          why_it_matters: string | null
        }
        Insert: {
          body_markdown?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["article_vertical"]
          what_happened?: string | null
          what_to_do?: string | null
          why_it_matters?: string | null
        }
        Update: {
          body_markdown?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["article_vertical"]
          what_happened?: string | null
          what_to_do?: string | null
          why_it_matters?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry_id: string | null
          location_id: string | null
          logo: string | null
          name: string
          size: string | null
          slug: string
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry_id?: string | null
          location_id?: string | null
          logo?: string | null
          name: string
          size?: string | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry_id?: string | null
          location_id?: string | null
          logo?: string | null
          name?: string
          size?: string | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          active: boolean
          auto_publish: boolean
          category: string
          created_at: string
          id: string
          last_scraped_at: string | null
          name: string
          scrape_interval_hours: number
          scrape_path: string
          slug: string
          target_section: string | null
          target_vertical: string
          trust_level: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          auto_publish?: boolean
          category?: string
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          name: string
          scrape_interval_hours?: number
          scrape_path?: string
          slug: string
          target_section?: string | null
          target_vertical?: string
          trust_level?: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          auto_publish?: boolean
          category?: string
          created_at?: string
          id?: string
          last_scraped_at?: string | null
          name?: string
          scrape_interval_hours?: number
          scrape_path?: string
          slug?: string
          target_section?: string | null
          target_vertical?: string
          trust_level?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      dashboard_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      data_import_batches: {
        Row: {
          batch_id: string
          error_log: string | null
          finished_at: string | null
          id: string
          import_type: string
          records_inserted: number
          records_received: number
          records_updated: number
          source_name: string
          source_url: string | null
          started_at: string
          status: string
        }
        Insert: {
          batch_id: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          import_type?: string
          records_inserted?: number
          records_received?: number
          records_updated?: number
          source_name: string
          source_url?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          batch_id?: string
          error_log?: string | null
          finished_at?: string | null
          id?: string
          import_type?: string
          records_inserted?: number
          records_received?: number
          records_updated?: number
          source_name?: string
          source_url?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      directory_articles: {
        Row: {
          article_type: Database["public"]["Enums"]["directory_article_type"]
          content: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["directory_article_type"]
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          article_type?: Database["public"]["Enums"]["directory_article_type"]
          content?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hs_sector_mapping: {
        Row: {
          display_order: number
          hs_code_prefix: string
          id: string
          is_active: boolean
          sector_group: string
          sector_name: string
        }
        Insert: {
          display_order?: number
          hs_code_prefix: string
          id?: string
          is_active?: boolean
          sector_group: string
          sector_name: string
        }
        Update: {
          display_order?: number
          hs_code_prefix?: string
          id?: string
          is_active?: boolean
          sector_group?: string
          sector_name?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          is_whoiswho: boolean
          name: string
          photo: string | null
          slug: string
          title: string | null
          updated_at: string
          whoiswho_quote: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          is_whoiswho?: boolean
          name: string
          photo?: string | null
          slug: string
          title?: string | null
          updated_at?: string
          whoiswho_quote?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          is_whoiswho?: boolean
          name?: string
          photo?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
          whoiswho_quote?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          id: string
          job_title: string | null
          tier: Database["public"]["Enums"]["user_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          tier?: Database["public"]["Enums"]["user_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      raw_trade_imports: {
        Row: {
          batch_id: string | null
          country_code: string | null
          country_name: string | null
          hs_code: string | null
          hs_description: string | null
          id: string
          import_value_eur: number
          imported_at: string
          month: number
          period_label: string | null
          quantity: number | null
          source_dataset_code: string | null
          source_dataset_name: string | null
          source_url: string | null
          unit: string | null
          year: number
        }
        Insert: {
          batch_id?: string | null
          country_code?: string | null
          country_name?: string | null
          hs_code?: string | null
          hs_description?: string | null
          id?: string
          import_value_eur?: number
          imported_at?: string
          month: number
          period_label?: string | null
          quantity?: number | null
          source_dataset_code?: string | null
          source_dataset_name?: string | null
          source_url?: string | null
          unit?: string | null
          year: number
        }
        Update: {
          batch_id?: string | null
          country_code?: string | null
          country_name?: string | null
          hs_code?: string | null
          hs_description?: string | null
          id?: string
          import_value_eur?: number
          imported_at?: string
          month?: number
          period_label?: string | null
          quantity?: number | null
          source_dataset_code?: string | null
          source_dataset_name?: string | null
          source_url?: string | null
          unit?: string | null
          year?: number
        }
        Relationships: []
      }
      relationships: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_current: boolean
          person_id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_current?: boolean
          person_id: string
          role: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_current?: boolean
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          api_reference: string | null
          company_id: string
          created_at: string
          id: string
          price: number
          report_type: string
          updated_at: string
        }
        Insert: {
          api_reference?: string | null
          company_id: string
          created_at?: string
          id?: string
          price?: number
          report_type?: string
          updated_at?: string
        }
        Update: {
          api_reference?: string | null
          company_id?: string
          created_at?: string
          id?: string
          price?: number
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_data: Json | null
          item_id: string
          item_title: string | null
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id: string
          item_title?: string | null
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id?: string
          item_title?: string | null
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsored_content: {
        Row: {
          active: boolean
          category: string
          created_at: string
          href: string
          id: string
          image_url: string | null
          sort_order: number
          sponsor_name: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          href?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          sponsor_name: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          href?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          sponsor_name?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_ai_insights: {
        Row: {
          created_at: string
          date_month: string
          id: string
          insight_type: string
          is_published: boolean
          summary_text: string
          supporting_metrics_json: Json | null
          title: string
        }
        Insert: {
          created_at?: string
          date_month: string
          id?: string
          insight_type: string
          is_published?: boolean
          summary_text: string
          supporting_metrics_json?: Json | null
          title: string
        }
        Update: {
          created_at?: string
          date_month?: string
          id?: string
          insight_type?: string
          is_published?: boolean
          summary_text?: string
          supporting_metrics_json?: Json | null
          title?: string
        }
        Relationships: []
      }
      trade_countries: {
        Row: {
          country_code: string
          country_name: string
          eu_member: boolean
          id: string
          priority_country: boolean
          region_name: string | null
          slug: string
        }
        Insert: {
          country_code: string
          country_name: string
          eu_member?: boolean
          id?: string
          priority_country?: boolean
          region_name?: string | null
          slug: string
        }
        Update: {
          country_code?: string
          country_name?: string
          eu_member?: boolean
          id?: string
          priority_country?: boolean
          region_name?: string | null
          slug?: string
        }
        Relationships: []
      }
      trade_country_monthly: {
        Row: {
          country_id: string | null
          country_share_pct: number | null
          created_at: string
          date_month: string
          id: string
          month: number
          rank_position: number | null
          total_imports_eur: number
          year: number
        }
        Insert: {
          country_id?: string | null
          country_share_pct?: number | null
          created_at?: string
          date_month: string
          id?: string
          month: number
          rank_position?: number | null
          total_imports_eur?: number
          year: number
        }
        Update: {
          country_id?: string | null
          country_share_pct?: number | null
          created_at?: string
          date_month?: string
          id?: string
          month?: number
          rank_position?: number | null
          total_imports_eur?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_country_monthly_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "trade_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_imports_clean: {
        Row: {
          country_id: string | null
          created_at: string
          date_month: string
          hs_code: string | null
          hs_description: string | null
          id: string
          import_value_eur: number
          month: number
          period_label: string | null
          quantity: number | null
          raw_id: string | null
          sector_group: string | null
          sector_name: string | null
          unit: string | null
          year: number
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          date_month: string
          hs_code?: string | null
          hs_description?: string | null
          id?: string
          import_value_eur?: number
          month: number
          period_label?: string | null
          quantity?: number | null
          raw_id?: string | null
          sector_group?: string | null
          sector_name?: string | null
          unit?: string | null
          year: number
        }
        Update: {
          country_id?: string | null
          created_at?: string
          date_month?: string
          hs_code?: string | null
          hs_description?: string | null
          id?: string
          import_value_eur?: number
          month?: number
          period_label?: string | null
          quantity?: number | null
          raw_id?: string | null
          sector_group?: string | null
          sector_name?: string | null
          unit?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_imports_clean_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "trade_countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_imports_clean_raw_id_fkey"
            columns: ["raw_id"]
            isOneToOne: false
            referencedRelation: "raw_trade_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_kpi_snapshots: {
        Row: {
          created_at: string
          date_month: string
          eu_share_pct: number | null
          id: string
          import_concentration_pct: number | null
          mom_growth_pct: number | null
          non_eu_share_pct: number | null
          top_3_sectors_share_pct: number | null
          top_5_countries_share_pct: number | null
          top_import_country_id: string | null
          top_import_country_value_eur: number | null
          top_import_sector: string | null
          top_import_sector_value_eur: number | null
          total_imports_eur: number
          yoy_growth_pct: number | null
        }
        Insert: {
          created_at?: string
          date_month: string
          eu_share_pct?: number | null
          id?: string
          import_concentration_pct?: number | null
          mom_growth_pct?: number | null
          non_eu_share_pct?: number | null
          top_3_sectors_share_pct?: number | null
          top_5_countries_share_pct?: number | null
          top_import_country_id?: string | null
          top_import_country_value_eur?: number | null
          top_import_sector?: string | null
          top_import_sector_value_eur?: number | null
          total_imports_eur?: number
          yoy_growth_pct?: number | null
        }
        Update: {
          created_at?: string
          date_month?: string
          eu_share_pct?: number | null
          id?: string
          import_concentration_pct?: number | null
          mom_growth_pct?: number | null
          non_eu_share_pct?: number | null
          top_3_sectors_share_pct?: number | null
          top_5_countries_share_pct?: number | null
          top_import_country_id?: string | null
          top_import_country_value_eur?: number | null
          top_import_sector?: string | null
          top_import_sector_value_eur?: number | null
          total_imports_eur?: number
          yoy_growth_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_kpi_snapshots_top_import_country_id_fkey"
            columns: ["top_import_country_id"]
            isOneToOne: false
            referencedRelation: "trade_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_monthly_totals: {
        Row: {
          created_at: string
          date_month: string
          id: string
          mom_growth_pct: number | null
          month: number
          total_imports_eur: number
          year: number
          yoy_growth_pct: number | null
        }
        Insert: {
          created_at?: string
          date_month: string
          id?: string
          mom_growth_pct?: number | null
          month: number
          total_imports_eur?: number
          year: number
          yoy_growth_pct?: number | null
        }
        Update: {
          created_at?: string
          date_month?: string
          id?: string
          mom_growth_pct?: number | null
          month?: number
          total_imports_eur?: number
          year?: number
          yoy_growth_pct?: number | null
        }
        Relationships: []
      }
      trade_sector_monthly: {
        Row: {
          created_at: string
          date_month: string
          id: string
          mom_growth_pct: number | null
          month: number
          rank_position: number | null
          sector_group: string | null
          sector_name: string
          sector_share_pct: number | null
          total_imports_eur: number
          year: number
          yoy_growth_pct: number | null
        }
        Insert: {
          created_at?: string
          date_month: string
          id?: string
          mom_growth_pct?: number | null
          month: number
          rank_position?: number | null
          sector_group?: string | null
          sector_name: string
          sector_share_pct?: number | null
          total_imports_eur?: number
          year: number
          yoy_growth_pct?: number | null
        }
        Update: {
          created_at?: string
          date_month?: string
          id?: string
          mom_growth_pct?: number | null
          month?: number
          rank_position?: number | null
          sector_group?: string | null
          sector_name?: string
          sector_share_pct?: number | null
          total_imports_eur?: number
          year?: number
          yoy_growth_pct?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          alert_types: string[]
          created_at: string
          digest_frequency: string
          id: string
          updated_at: string
          user_id: string
          verticals: string[]
        }
        Insert: {
          alert_types?: string[]
          created_at?: string
          digest_frequency?: string
          id?: string
          updated_at?: string
          user_id: string
          verticals?: string[]
        }
        Update: {
          alert_types?: string[]
          created_at?: string
          digest_frequency?: string
          id?: string
          updated_at?: string
          user_id?: string
          verticals?: string[]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_most_read_articles: {
        Args: { _limit?: number }
        Returns: {
          article_id: string
          image_url: string
          title: string
          vertical: string
          view_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      article_status: "draft" | "published" | "archived"
      article_vertical: "compliance" | "fintech" | "sme" | "general"
      directory_article_type: "news" | "interview" | "insight" | "whoiswho"
      user_tier: "free" | "premium"
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
      app_role: ["admin", "moderator", "user"],
      article_status: ["draft", "published", "archived"],
      article_vertical: ["compliance", "fintech", "sme", "general"],
      directory_article_type: ["news", "interview", "insight", "whoiswho"],
      user_tier: ["free", "premium"],
    },
  },
} as const
