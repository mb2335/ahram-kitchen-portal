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

export interface MenuFormData {
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  price: string;
  is_available: boolean;
  quantity: string;
}