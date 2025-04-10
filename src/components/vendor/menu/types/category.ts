
export interface PickupDetail {
  day: number;
  time: string;
  location: string;
}

export interface DeliverySettings {
  time_interval?: number;
  start_time?: string;
  end_time?: string;
}

export interface CategoryFormData {
  name: string;
  name_ko: string;
  has_custom_pickup: boolean;
  pickup_details: PickupDetail[];
  fulfillment_types: string[];
  pickup_days: number[];
  delivery_settings?: DeliverySettings;
}

export interface Category {
  id: string;
  name: string;
  name_ko: string;
  has_custom_pickup: boolean;
  pickup_details: PickupDetail[];
  fulfillment_types: string[];
  pickup_days: number[];
  order_index: number;
  blocked_dates?: string[];
  delivery_settings?: DeliverySettings;
}
