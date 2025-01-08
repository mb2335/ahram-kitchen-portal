export interface PickupDetail {
  time: string;
  location: string;
}

export interface Category {
  id: string;
  vendor_id: string | null;
  name: string;
  name_ko: string;
  order_index: number;
  created_at: string | null;
  delivery_available_from: string | null;
  delivery_available_until: string | null;
  pickup_details: PickupDetail[];
  has_custom_pickup: boolean;
}

export interface CategoryFormData {
  name: string;
  name_ko: string;
  deliveryAvailableFrom: Date | undefined;
  deliveryAvailableUntil: Date | undefined;
  has_custom_pickup: boolean;
  pickup_details: PickupDetail[];
}