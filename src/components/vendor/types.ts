
export interface Order {
  id: string;
  customer_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  tax_amount: number;
  status: OrderStatus;
  delivery_date: string;
  notes?: string;
  payment_proof_url: string;
  created_at: string;
  rejection_reason?: string;
  pickup_time?: string;
  pickup_location?: string;
  fulfillment_type?: string;
  delivery_address?: string;
  delivery_time_slot?: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  } | null;
  order_items: OrderItem[];
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item?: {
    id: string;
    name: string;
    name_ko: string;
    category?: {
      id: string;
      name: string;
      name_ko: string;
    };
  };
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  name_ko: string;
  order_index: number;
  fulfillment_types?: string[];
  blocked_dates?: string[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';
