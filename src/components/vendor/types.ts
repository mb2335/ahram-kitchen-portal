export interface Announcement {
  id: string;
  vendor_id: string | null;
  title: string;
  title_ko: string | null;
  content: string;
  content_ko: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  menu_item?: {
    id: string;
    name: string;
    name_ko: string;
  };
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  tax_amount: number;
  status: OrderStatus;
  notes: string | null;
  delivery_date: string;
  payment_proof_url: string;
  rejection_reason: string | null;
  created_at: string | null;
  customer?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  order_items?: OrderItem[];
}