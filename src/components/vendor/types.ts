
export interface Order {
  id: string;
  customer_id?: string;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  delivery_date: string;
  created_at: string;
  status: string;
  notes?: string;
  payment_proof_url: string;
  rejection_reason?: string;
  pickup_time?: string;
  pickup_location?: string;
  fulfillment_type?: string;
  delivery_address?: string;
  delivery_time_slot?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer?: Customer;
  order_items?: OrderItem[];
}

export interface Customer {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  sms_opt_in?: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  menu_item?: MenuItem;
}

export interface MenuItem {
  id: string;
  name: string;
  name_ko?: string;
  price: number;
  discount_percentage?: number;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  name_ko?: string;
}
