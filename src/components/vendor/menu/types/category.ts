
export interface PickupDetail {
  day: number;
  time: string;
  location: string;
}

export interface DeliverySettings {
  activated_slots: string[];
}

export interface CategoryFormData {
  name: string;
  name_ko: string;
  fulfillment_types: string[];
  has_custom_pickup?: boolean;
}

export interface Category {
  id: string;
  name: string;
  name_ko: string;
  has_custom_pickup: boolean;
  fulfillment_types: string[];
  order_index: number;
  blocked_dates?: string[];
  vendor_id?: string;
  created_at?: string;
}
