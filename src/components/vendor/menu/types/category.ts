
export interface PickupDetail {
  day: number; // 0-6 representing days of week (Sunday=0, Monday=1, etc.)
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
  pickup_details: PickupDetail[];
  has_custom_pickup: boolean;
  fulfillment_types: string[];
  pickup_days: number[]; // 0-6 representing days of week for pickup (Sunday=0, Monday=1, etc.)
}

export interface CategoryFormData {
  name: string;
  name_ko: string;
  has_custom_pickup: boolean;
  pickup_details: PickupDetail[];
  fulfillment_types: string[];
  pickup_days: number[]; // Days of week available for pickup
}
