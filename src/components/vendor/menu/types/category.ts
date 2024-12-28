export interface Category {
  id: string;
  vendor_id: string | null;
  name: string;
  name_ko: string;
  order_index: number;
  created_at: string | null;
  delivery_available_from: string | null;
  delivery_available_until: string | null;
}

export interface CategoryFormData {
  name: string;
  name_ko: string;
  deliveryAvailableFrom: Date | undefined;
  deliveryAvailableUntil: Date | undefined;
}