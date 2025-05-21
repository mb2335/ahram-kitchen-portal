
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
      }
      delivery_schedules: {
        Row: {
          id: string
          category_id: string
          day_of_week: number
          active: boolean
          created_at: string | null
          activated_slots: string[] | null
        }
        Insert: {
          id?: string
          category_id: string
          day_of_week: number
          active?: boolean
          created_at?: string | null
          activated_slots?: string[] | null
        }
        Update: {
          id?: string
          category_id?: string
          day_of_week?: number
          active?: boolean
          created_at?: string | null
          activated_slots?: string[] | null
        }
      }
      delivery_time_bookings: {
        Row: {
          id: string
          order_id: string
          category_id: string
          delivery_date: string
          time_slot: string
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          category_id: string
          delivery_date: string
          time_slot: string
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          category_id?: string
          delivery_date?: string
          time_slot?: string
          created_at?: string | null
        }
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
          pickup_days: number[] | null
          pickup_details: Json[] | null
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
          pickup_days?: number[] | null
          pickup_details?: Json[] | null
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
          pickup_days?: number[] | null
          pickup_details?: Json[] | null
          vendor_id?: string | null
        }
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
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          menu_item_id: string
          quantity: number
          unit_price: number
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          menu_item_id: string
          quantity: number
          unit_price: number
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          menu_item_id?: string
          quantity?: number
          unit_price?: number
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          total_amount: number
          tax_amount: number
          delivery_date: string
          created_at: string | null
          status: string
          notes: string | null
          payment_proof_url: string
          rejection_reason: string | null
          pickup_time: string | null
          pickup_location: string | null
          fulfillment_type: string | null
          delivery_address: string | null
          delivery_time_slot: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          total_amount: number
          tax_amount: number
          delivery_date: string
          created_at?: string | null
          status?: string
          notes?: string | null
          payment_proof_url: string
          rejection_reason?: string | null
          pickup_time?: string | null
          pickup_location?: string | null
          fulfillment_type?: string | null
          delivery_address?: string | null
          delivery_time_slot?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          total_amount?: number
          tax_amount?: number
          delivery_date?: string
          created_at?: string | null
          status?: string
          notes?: string | null
          payment_proof_url?: string
          rejection_reason?: string | null
          pickup_time?: string | null
          pickup_location?: string | null
          fulfillment_type?: string | null
          delivery_address?: string | null
          delivery_time_slot?: string | null
        }
      }
      vendors: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          is_active: boolean | null
          phone: string | null
          business_name: string
          email: string
          receive_notifications: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          is_active?: boolean | null
          phone?: string | null
          business_name: string
          email: string
          receive_notifications?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          is_active?: boolean | null
          phone?: string | null
          business_name?: string
          email?: string
          receive_notifications?: boolean | null
        }
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
