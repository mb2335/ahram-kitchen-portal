export interface MenuItem {
  id: string;
  vendor_id: string | null;
  name: string;
  name_ko: string;
  description?: string;
  description_ko?: string;
  price: number;
  is_available: boolean;
  image?: string;
  order_index: number;
  quantity_limit: number;
  created_at?: string;
}

export interface MenuFormData {
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  price: string;
  quantity_limit: string;
  is_available: boolean;
}