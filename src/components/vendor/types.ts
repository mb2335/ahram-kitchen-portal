import type { Database } from '@/integrations/supabase/types';

export type Announcement = Database['public']['Tables']['announcements']['Row'];

export interface MenuItem {
  id: string;
  vendor_id: string | null;
  name: string;
  name_ko: string;
  description?: string;
  description_ko?: string;
  price: number;
  image?: string;
  is_available: boolean;
  created_at?: string;
  order_index: number;
  quantity?: number | null;
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
  order_items?: {
    id: string;
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    menu_item?: {
      id: string;
      name: string;
      name_ko: string;
      price: number;
      description?: string;
      description_ko?: string;
    };
  }[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';