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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          active: boolean
          created_at: string
          email: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      admin_metrics: {
        Row: {
          acquisition_spend: number
          active_customers: number
          cash_balance: number
          churned_customers: number
          churned_mrr: number
          contraction_mrr: number
          converted_trials: number
          csat_average: number
          dau: number
          expansion_mrr: number
          gross_margin_percent: number
          mau: number
          monthly_expenses: number
          monthly_revenue: number
          mrr: number
          new_customers: number
          nps_detractors: number
          nps_passives: number
          nps_promoters: number
          period_end: string
          period_label: string
          period_start: string
          previous_active_customers: number
          previous_mrr: number
          starting_mrr: number
          trials: number
          ttv_days: number
          updated_at: string
          user_id: string
          visitors: number
        }
        Insert: {
          acquisition_spend?: number
          active_customers?: number
          cash_balance?: number
          churned_customers?: number
          churned_mrr?: number
          contraction_mrr?: number
          converted_trials?: number
          csat_average?: number
          dau?: number
          expansion_mrr?: number
          gross_margin_percent?: number
          mau?: number
          monthly_expenses?: number
          monthly_revenue?: number
          mrr?: number
          new_customers?: number
          nps_detractors?: number
          nps_passives?: number
          nps_promoters?: number
          period_end?: string
          period_label?: string
          period_start?: string
          previous_active_customers?: number
          previous_mrr?: number
          starting_mrr?: number
          trials?: number
          ttv_days?: number
          updated_at?: string
          user_id: string
          visitors?: number
        }
        Update: {
          acquisition_spend?: number
          active_customers?: number
          cash_balance?: number
          churned_customers?: number
          churned_mrr?: number
          contraction_mrr?: number
          converted_trials?: number
          csat_average?: number
          dau?: number
          expansion_mrr?: number
          gross_margin_percent?: number
          mau?: number
          monthly_expenses?: number
          monthly_revenue?: number
          mrr?: number
          new_customers?: number
          nps_detractors?: number
          nps_passives?: number
          nps_promoters?: number
          period_end?: string
          period_label?: string
          period_start?: string
          previous_active_customers?: number
          previous_mrr?: number
          starting_mrr?: number
          trials?: number
          ttv_days?: number
          updated_at?: string
          user_id?: string
          visitors?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          order_id: string | null
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          transaction_date?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "admin_marketplace_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          desired_margin_percent: number
          execution_minutes: number
          fixed_cost_allocation: number
          id: string
          is_promo_sale_active: boolean
          item_type: string
          labor_cost: number
          main_benefit: string | null
          materials_cost: number
          name: string
          pain_point_solved: string | null
          platform_tax_percent: number
          promo_sale_price: number | null
          suggested_price: number
          target_audience: string | null
          total_unit_cost: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          desired_margin_percent?: number
          execution_minutes?: number
          fixed_cost_allocation?: number
          id?: string
          is_promo_sale_active?: boolean
          item_type: string
          labor_cost?: number
          main_benefit?: string | null
          materials_cost?: number
          name: string
          pain_point_solved?: string | null
          platform_tax_percent?: number
          promo_sale_price?: number | null
          suggested_price: number
          target_audience?: string | null
          total_unit_cost: number
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          desired_margin_percent?: number
          execution_minutes?: number
          fixed_cost_allocation?: number
          id?: string
          is_promo_sale_active?: boolean
          item_type?: string
          labor_cost?: number
          main_benefit?: string | null
          materials_cost?: number
          name?: string
          pain_point_solved?: string | null
          platform_tax_percent?: number
          promo_sale_price?: number | null
          suggested_price?: number
          target_audience?: string | null
          total_unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_recipes: {
        Row: {
          catalog_item_id: string
          id: string
          inventory_item_id: string
          quantity_used: number
        }
        Insert: {
          catalog_item_id: string
          id?: string
          inventory_item_id: string
          quantity_used: number
        }
        Update: {
          catalog_item_id?: string
          id?: string
          inventory_item_id?: string
          quantity_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_recipes_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_recipes_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          current_stock: number
          id: string
          is_promo_active: boolean
          min_stock_alert: number
          name: string
          package_quantity: number
          promo_price: number | null
          regular_price: number
          supplier_name: string | null
          unit_cost_active: number | null
          unit_cost_regular: number | null
          unit_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          current_stock?: number
          id?: string
          is_promo_active?: boolean
          min_stock_alert?: number
          name: string
          package_quantity: number
          promo_price?: number | null
          regular_price: number
          supplier_name?: string | null
          unit_cost_active?: number | null
          unit_cost_regular?: number | null
          unit_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          current_stock?: number
          id?: string
          is_promo_active?: boolean
          min_stock_alert?: number
          name?: string
          package_quantity?: number
          promo_price?: number | null
          regular_price?: number
          supplier_name?: string | null
          unit_cost_active?: number | null
          unit_cost_regular?: number | null
          unit_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          expires_at: string
          state: string
          user_id: string
          verifier: string
        }
        Insert: {
          expires_at: string
          state: string
          user_id: string
          verifier: string
        }
        Update: {
          expires_at?: string
          state?: string
          user_id?: string
          verifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          catalog_item_id: string
          checkout_url: string | null
          created_at: string
          customer_name: string
          customer_whatsapp: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payment_method: string
          quantity: number
          status: string
          stock_deducted: boolean
          total_amount: number
          total_cost_snapshot: number
          unit_price_charged: number
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          checkout_url?: string | null
          created_at?: string
          customer_name: string
          customer_whatsapp?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method: string
          quantity?: number
          status?: string
          stock_deducted?: boolean
          total_amount: number
          total_cost_snapshot: number
          unit_price_charged: number
          user_id: string
        }
        Update: {
          catalog_item_id?: string
          checkout_url?: string | null
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payment_method?: string
          quantity?: number
          status?: string
          stock_deducted?: boolean
          total_amount?: number
          total_cost_snapshot?: number
          unit_price_charged?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_connections: {
        Row: {
          access_token: string
          expires_at: string | null
          mp_user_id: string | null
          public_key: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          expires_at?: string | null
          mp_user_id?: string | null
          public_key?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          expires_at?: string | null
          mp_user_id?: string | null
          public_key?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admin_inputs: {
        Row: {
          acquisition_spend: number
          cash_balance: number
          contraction_mrr: number
          converted_trials: number
          csat_average: number
          dau: number
          expansion_mrr: number
          gross_margin_percent: number
          id: number
          mau: number
          monthly_expenses: number
          monthly_revenue: number
          nps_detractors: number
          nps_passives: number
          nps_promoters: number
          period_end: string
          period_label: string
          period_start: string
          trials: number
          ttv_days: number
          updated_at: string
          visitors: number
        }
        Insert: {
          acquisition_spend?: number
          cash_balance?: number
          contraction_mrr?: number
          converted_trials?: number
          csat_average?: number
          dau?: number
          expansion_mrr?: number
          gross_margin_percent?: number
          id?: number
          mau?: number
          monthly_expenses?: number
          monthly_revenue?: number
          nps_detractors?: number
          nps_passives?: number
          nps_promoters?: number
          period_end?: string
          period_label?: string
          period_start?: string
          trials?: number
          ttv_days?: number
          updated_at?: string
          visitors?: number
        }
        Update: {
          acquisition_spend?: number
          cash_balance?: number
          contraction_mrr?: number
          converted_trials?: number
          csat_average?: number
          dau?: number
          expansion_mrr?: number
          gross_margin_percent?: number
          id?: number
          mau?: number
          monthly_expenses?: number
          monthly_revenue?: number
          nps_detractors?: number
          nps_passives?: number
          nps_promoters?: number
          period_end?: string
          period_label?: string
          period_start?: string
          trials?: number
          ttv_days?: number
          updated_at?: string
          visitors?: number
        }
        Relationships: []
      }
      platform_subscriptions: {
        Row: {
          activated_at: string | null
          amount: number
          cancelled_at: string | null
          checkout_url: string | null
          created_at: string
          currency: string
          email: string
          external_reference: string
          id: string
          last_payment_at: string | null
          last_webhook_at: string | null
          payer_name: string | null
          preapproval_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          amount?: number
          cancelled_at?: string | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          email: string
          external_reference: string
          id?: string
          last_payment_at?: string | null
          last_webhook_at?: string | null
          payer_name?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          amount?: number
          cancelled_at?: string | null
          checkout_url?: string | null
          created_at?: string
          currency?: string
          email?: string
          external_reference?: string
          id?: string
          last_payment_at?: string | null
          last_webhook_at?: string | null
          payer_name?: string | null
          preapproval_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_bands: {
        Row: {
          catalog_item_id: string
          id: string
          label: string
          max_quantity: number | null
          min_quantity: number
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          catalog_item_id: string
          id?: string
          label: string
          max_quantity?: number | null
          min_quantity: number
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          catalog_item_id?: string
          id?: string
          label?: string
          max_quantity?: number | null
          min_quantity?: number
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_bands_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_bands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          business_type: string
          created_at: string
          hourly_rate: number
          id: string
          monthly_fixed_costs: number
          monthly_income_goal: number
          monthly_work_hours: number
          mp_connected: boolean
        }
        Insert: {
          business_name?: string | null
          business_type?: string
          created_at?: string
          hourly_rate?: number
          id: string
          monthly_fixed_costs?: number
          monthly_income_goal?: number
          monthly_work_hours?: number
          mp_connected?: boolean
        }
        Update: {
          business_name?: string | null
          business_type?: string
          created_at?: string
          hourly_rate?: number
          id?: string
          monthly_fixed_costs?: number
          monthly_income_goal?: number
          monthly_work_hours?: number
          mp_connected?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      admin_marketplace_sales: {
        Row: {
          checkout_url: string | null
          created_at: string | null
          customer_name: string | null
          id: string | null
          item_name: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          quantity: number | null
          status: string | null
          total_amount: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_metrics_snapshot: {
        Row: {
          arpa: number | null
          arr: number | null
          burn_rate: number | null
          cac: number | null
          cac_payback_months: number | null
          csat: number | null
          customer_churn: number | null
          dau: number | null
          dau_mau: number | null
          ltv: number | null
          ltv_cac: number | null
          mau: number | null
          mrr: number | null
          mrr_growth: number | null
          nps: number | null
          nrr: number | null
          period_end: string | null
          period_label: string | null
          period_start: string | null
          revenue_churn: number | null
          runway_months: number | null
          trial_to_customer: number | null
          ttv_days: number | null
          user_id: string | null
          visitor_to_customer: number | null
          visitor_to_trial: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_marketplace_sales_summary: {
        Args: never
        Returns: {
          cancelled: number
          gross_paid: number
          paid: number
          pending: number
          total: number
        }[]
      }
      create_sale: {
        Args: {
          p_customer: string
          p_item: string
          p_method: string
          p_promo: boolean
          p_quantity: number
          p_whatsapp: string
        }
        Returns: string
      }
      process_paid_order: { Args: { p_order_id: string }; Returns: undefined }
      resolve_price_band: {
        Args: {
          p_catalog_item_id: string
          p_default_price: number
          p_quantity: number
          p_user_id: string
        }
        Returns: number
      }
      restock_item: {
        Args: {
          p_expense: boolean
          p_id: string
          p_promo: boolean
          p_quantity: number
        }
        Returns: undefined
      }
      reverse_paid_order: { Args: { p_order_id: string }; Returns: undefined }
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
    Enums: {},
  },
} as const
