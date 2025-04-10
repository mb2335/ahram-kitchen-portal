
export interface Tables {
  customers: {
    Row: {
      id: string;
      user_id: string;
      created_at: string;
      full_name: string;
      email: string;
      phone: string;
    };
    Insert: {
      id?: string;
      user_id?: string;
      created_at?: string;
      full_name: string;
      email: string;
      phone?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      created_at?: string;
      full_name?: string;
      email?: string;
      phone?: string;
    };
    Relationships: [];
  };
  menu_categories: {
    Row: {
      id: string;
      vendor_id: string;
      order_index: number;
      created_at: string;
      has_custom_pickup: boolean;
      pickup_details: any[];
      pickup_days: number[];
      fulfillment_types: string[];
      name: string;
      name_ko: string;
      blocked_dates: string[];
    };
    Insert: {
      id?: string;
      vendor_id?: string;
      order_index: number;
      created_at?: string;
      has_custom_pickup?: boolean;
      pickup_details?: any[];
      pickup_days?: number[];
      fulfillment_types?: string[];
      name: string;
      name_ko: string;
      blocked_dates?: string[];
    };
    Update: {
      id?: string;
      vendor_id?: string;
      order_index?: number;
      created_at?: string;
      has_custom_pickup?: boolean;
      pickup_details?: any[];
      pickup_days?: number[];
      fulfillment_types?: string[];
      name?: string;
      name_ko?: string;
      blocked_dates?: string[];
    };
    Relationships: [];
  };
  vendors: {
    Row: {
      id: string;
      user_id: string;
      created_at: string;
      is_active: boolean;
      phone: string;
      business_name: string;
      email: string;
    };
    Insert: {
      id?: string;
      user_id?: string;
      created_at?: string;
      is_active?: boolean;
      phone?: string;
      business_name: string;
      email: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      created_at?: string;
      is_active?: boolean;
      phone?: string;
      business_name?: string;
      email?: string;
    };
    Relationships: [];
  };
  menu_items: {
    Row: {
      id: string;
      vendor_id: string;
      category_id: string;
      price: number;
      is_available: boolean;
      created_at: string;
      order_index: number;
      quantity_limit: number;
      discount_percentage: number;
      name: string;
      name_ko: string;
      description: string;
      description_ko: string;
      image: string;
    };
    Insert: {
      id?: string;
      vendor_id?: string;
      category_id?: string;
      price: number;
      is_available?: boolean;
      created_at?: string;
      order_index: number;
      quantity_limit?: number;
      discount_percentage?: number;
      name: string;
      name_ko: string;
      description?: string;
      description_ko?: string;
      image?: string;
    };
    Update: {
      id?: string;
      vendor_id?: string;
      category_id?: string;
      price?: number;
      is_available?: boolean;
      created_at?: string;
      order_index?: number;
      quantity_limit?: number;
      discount_percentage?: number;
      name?: string;
      name_ko?: string;
      description?: string;
      description_ko?: string;
      image?: string;
    };
    Relationships: [];
  };
  order_items: {
    Row: {
      id: string;
      order_id: string;
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id?: string;
      menu_item_id: string;
      quantity: number;
      unit_price: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      menu_item_id?: string;
      quantity?: number;
      unit_price?: number;
      created_at?: string;
    };
    Relationships: [];
  };
  orders: {
    Row: {
      id: string;
      customer_id: string;
      total_amount: number;
      tax_amount: number;
      status: string;
      notes: string | null;
      delivery_date: string;
      payment_proof_url: string;
      rejection_reason: string | null;
      created_at: string;
      pickup_time: string | null;
      pickup_location: string | null;
      fulfillment_type: string;
      delivery_address: string | null;
      delivery_time_slot_id?: string | null;
      delivery_time_start?: string | null;
      delivery_time_end?: string | null;
    };
    Insert: {
      id?: string;
      customer_id: string;
      total_amount: number;
      tax_amount: number;
      status?: string;
      notes?: string | null;
      delivery_date: string;
      payment_proof_url: string;
      rejection_reason?: string | null;
      created_at?: string;
      pickup_time?: string | null;
      pickup_location?: string | null;
      fulfillment_type?: string;
      delivery_address?: string | null;
      delivery_time_slot_id?: string | null;
      delivery_time_start?: string | null;
      delivery_time_end?: string | null;
    };
    Update: {
      id?: string;
      customer_id?: string;
      total_amount?: number;
      tax_amount?: number;
      status?: string;
      notes?: string | null;
      delivery_date?: string;
      payment_proof_url?: string;
      rejection_reason?: string | null;
      created_at?: string;
      pickup_time?: string | null;
      pickup_location?: string | null;
      fulfillment_type?: string;
      delivery_address?: string | null;
      delivery_time_slot_id?: string | null;
      delivery_time_start?: string | null;
      delivery_time_end?: string | null;
    };
    Relationships: [];
  };
  // Add the new tables for delivery time slots
  delivery_schedules: {
    Row: {
      id: string;
      category_id: string | null;
      day_of_week: number;
      time_slots: TimeSlot[];
      active: boolean;
      created_at: string;
    };
    Insert: {
      id?: string;
      category_id?: string | null;
      day_of_week: number;
      time_slots: TimeSlot[];
      active?: boolean;
      created_at?: string;
    };
    Update: {
      id?: string;
      category_id?: string | null;
      day_of_week?: number;
      time_slots?: TimeSlot[];
      active?: boolean;
      created_at?: string;
    };
    Relationships: [];
  };
  delivery_time_bookings: {
    Row: {
      id: string;
      order_id: string;
      time_slot_id: string;
      booking_date: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      order_id: string;
      time_slot_id: string;
      booking_date: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      order_id?: string;
      time_slot_id?: string;
      booking_date?: string;
      created_at?: string;
    };
    Relationships: [];
  };
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  available: boolean;
  booked_by?: string;
  date?: string;
}
