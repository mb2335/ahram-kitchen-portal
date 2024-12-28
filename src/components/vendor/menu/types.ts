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
  quantity_limit: number | null;
  category_id?: string | null;
}

export interface MenuFormData {
  name: string;
  name_ko: string;
  description: string;
  description_ko: string;
  price: string;
  quantity_limit: string;
  is_available: boolean;
  category_id?: string;
}