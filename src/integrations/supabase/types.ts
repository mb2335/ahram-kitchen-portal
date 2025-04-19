export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      delivery_settings: {
        Row: {
          activated_slots: string[] | null
          active: boolean | null
          created_at: string | null
          day_of_week: number
          id: string
          vendor_id: string | null
        }
        Insert: {
          activated_slots?: string[] | null
          active?: boolean | null
          created_at?: string | null
          day_of_week: number
          id?: string
          vendor_id?: string | null
        }
        Update: {
          activated_slots?: string[] | null
          active?: boolean | null
          created_at?: string | null
          day_of_week?: number
          id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temp_delivery_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_time_bookings: {
        Row: {
          category_id: string
          created_at: string | null
          delivery_date: string
          id: string
          order_id: string
          time_slot: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          delivery_date: string
          id?: string
          order_id: string
          time_slot: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          delivery_date?: string
          id?: string
          order_id?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_time_bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_time_bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          blocked_dates: string[] | null
          created_at: string | null
          fulfillment_types: string[] | null
          has_custom_pickup: boolean | null
          id: string
          name: string
          name_ko: string
          order_index: number
          vendor_id: string | null
        }
        Insert: {
          blocked_dates?: string[] | null
          created_at?: string | null
          fulfillment_types?: string[] | null
          has_custom_pickup?: boolean | null
          id?: string
          name: string
          name_ko: string
          order_index: number
          vendor_id?: string | null
        }
        Update: {
          blocked_dates?: string[] | null
          created_at?: string | null
          fulfillment_types?: string[] | null
          has_custom_pickup?: boolean | null
          id?: string
          name?: string
          name_ko?: string
          order_index?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          description_ko: string | null
          discount_percentage: number | null
          id: string
          image: string | null
          is_available: boolean | null
          name: string
          name_ko: string
          order_index: number
          price: number
          quantity_limit: number | null
          vendor_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_ko?: string | null
          discount_percentage?: number | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          name: string
          name_ko: string
          order_index: number
          price: number
          quantity_limit?: number | null
          vendor_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_ko?: string | null
          discount_percentage?: number | null
          id?: string
          image?: string | null
          is_available?: boolean | null
          name?: string
          name_ko?: string
          order_index?: number
          price?: number
          quantity_limit?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string
          delivery_address: string | null
          delivery_date: string
          delivery_time_slot: string | null
          fulfillment_type: string | null
          id: string
          notes: string | null
          payment_proof_url: string
          pickup_location: string | null
          pickup_time: string | null
          rejection_reason: string | null
          status: string
          tax_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          delivery_address?: string | null
          delivery_date: string
          delivery_time_slot?: string | null
          fulfillment_type?: string | null
          id?: string
          notes?: string | null
          payment_proof_url: string
          pickup_location?: string | null
          pickup_time?: string | null
          rejection_reason?: string | null
          status?: string
          tax_amount: number
          total_amount: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          delivery_address?: string | null
          delivery_date?: string
          delivery_time_slot?: string | null
          fulfillment_type?: string | null
          id?: string
          notes?: string | null
          payment_proof_url?: string
          pickup_location?: string | null
          pickup_time?: string | null
          rejection_reason?: string | null
          status?: string
          tax_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_settings: {
        Row: {
          created_at: string | null
          day: number
          id: string
          location: string | null
          time: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          day: number
          id?: string
          location?: string | null
          time?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          day?: number
          id?: string
          location?: string | null
          time?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_delivery_settings: {
        Row: {
          active_days: number[]
          created_at: string | null
          id: string
          time_slots: string[]
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          active_days?: number[]
          created_at?: string | null
          id?: string
          time_slots?: string[]
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          active_days?: number[]
          created_at?: string | null
          id?: string
          time_slots?: string[]
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_delivery_settings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          business_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          user_id?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
