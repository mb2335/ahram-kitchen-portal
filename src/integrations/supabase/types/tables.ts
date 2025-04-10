export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Tables {
  announcements: {
    Row: {
      id: string
      vendor_id: string | null
      title: string
      title_ko: string | null
      content: string
      content_ko: string | null
      is_active: boolean | null
      start_date: string | null
      end_date: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      vendor_id?: string | null
      title: string
      title_ko?: string | null
      content: string
      content_ko?: string | null
      is_active?: boolean | null
      start_date?: string | null
      end_date?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      vendor_id?: string | null
      title?: string
      title_ko?: string | null
      content?: string
      content_ko?: string | null
      is_active?: boolean | null
      start_date?: string | null
      end_date?: string | null
      created_at?: string | null
    }
  }
  customers: {
    Row: {
      id: string
      user_id: string | null
      full_name: string
      email: string
      phone: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      user_id?: string | null
      full_name: string
      email: string
      phone?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      user_id?: string | null
      full_name?: string
      email?: string
      phone?: string | null
      created_at?: string | null
    }
  }
  menu_items: {
    Row: {
      id: string
      vendor_id: string | null
      name: string
      name_ko: string
      description: string | null
      description_ko: string | null
      price: number
      image: string | null
      category: string
      is_available: boolean | null
      created_at: string | null
    }
    Insert: {
      id?: string
      vendor_id?: string | null
      name: string
      name_ko: string
      description?: string | null
      description_ko?: string | null
      price: number
      image?: string | null
      category: string
      is_available?: boolean | null
      created_at?: string | null
    }
    Update: {
      id?: string
      vendor_id?: string | null
      name?: string
      name_ko?: string
      description?: string | null
      description_ko?: string | null
      price?: number
      image?: string | null
      category?: string
      is_available?: boolean | null
      created_at?: string | null
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
      status: string
      notes: string | null
      delivery_date: string
      payment_proof_url: string
      rejection_reason: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      customer_id: string
      total_amount: number
      tax_amount: number
      status?: string
      notes?: string | null
      delivery_date: string
      payment_proof_url: string
      rejection_reason?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      customer_id?: string
      total_amount?: number
      tax_amount?: number
      status?: string
      notes?: string | null
      delivery_date?: string
      payment_proof_url?: string
      rejection_reason?: string | null
      created_at?: string | null
    }
  }
  vendors: {
    Row: {
      id: string
      user_id: string | null
      business_name: string
      email: string
      phone: string | null
      is_active: boolean | null
      created_at: string | null
    }
    Insert: {
      id?: string
      user_id?: string | null
      business_name: string
      email: string
      phone?: string | null
      is_active?: boolean | null
      created_at?: string | null
    }
    Update: {
      id?: string
      user_id?: string | null
      business_name?: string
      email?: string
      phone?: string | null
      is_active?: boolean | null
      created_at?: string | null
    }
  }
}