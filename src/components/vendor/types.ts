export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    id: string;
    name: string;
    name_ko: string;
    category_id?: string;
    discount_percentage?: number;
    category?: {
      id: string;
      name: string;
      name_ko: string;
    };
  };
}

export interface Order {
  id: string;
  customer_id: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  total_amount: number;
  tax_amount: number;
  status: OrderStatus;
  notes?: string | null;
  delivery_date: string;
  payment_proof_url: string;
  rejection_reason?: string | null;
  created_at?: string;
  pickup_time?: string;
  pickup_location?: string;
  order_items?: OrderItem[];
}