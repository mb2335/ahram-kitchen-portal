import { PickupDetail } from './pickup';
import { DeliveryTimeSlotSelection } from './delivery';

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'rejected';

export interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
  category_id?: string;
  discount_percentage?: number | null;
  menu_item_id: string;
  unit_price: number;
  menu_item?: {
    id: string;
    name: string;
    name_ko: string;
    discount_percentage?: number;
    category?: {
      id: string;
      name: string;
      name_ko: string;
    };
  };
}

export interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDates: Record<string, Date>;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    smsOptIn: boolean;
    address?: string; // For delivery orders
  };
  pickupDetail: PickupDetail | null;
  fulfillmentType: string;
  categoryFulfillmentTypes?: Record<string, string>; // For mixed delivery types
  timeSlotSelections?: Record<string, DeliveryTimeSlotSelection>;
  onOrderSuccess: (orderId: string, isAuthenticated: boolean) => void;
}

export interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  delivery_date: string;
  notes?: string;
  customer_id?: string | null;
  pickup_time?: string;
  pickup_location?: string;
  payment_proof_url: string;
  tax_amount: number;
  fulfillment_type?: string;
  created_at: string;
  rejection_reason?: string;
  delivery_address?: string;
  delivery_time_slot?: string;
  relatedOrderIds?: string[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

export interface OrderHistoryItem {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_date: string;
  rejection_reason?: string;
  pickup_time?: string;
  pickup_location?: string;
  fulfillment_type?: string;
  delivery_address?: string;
  delivery_time_slot?: string;
  relatedOrderIds?: string[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

// Fulfillment types
export const FULFILLMENT_TYPE_PICKUP = 'pickup';
export const FULFILLMENT_TYPE_DELIVERY = 'delivery';

// Error messages for invalid selections
export const ERROR_MESSAGES = {
  PICKUP_INVALID_DAY: 'Pickup is only available on selected pickup days.',
  DELIVERY_INVALID_DAY: 'Delivery is not available on pickup days.',
  PICKUP_LOCATION_REQUIRED: 'Please select a pickup location and time.',
  DELIVERY_ADDRESS_REQUIRED: 'Please provide a delivery address.',
  DELIVERY_TIME_REQUIRED: 'Please select a delivery time slot.',
  MIXED_FULFILLMENT_INVALID: 'Your order contains items with different fulfillment requirements. Please select appropriate dates for each category.'
};

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  created_at: string;
  delivery_date: string;
  status: OrderStatus;
  total_amount: number;
  tax_amount: number;
  notes?: string;
  rejection_reason?: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  order_items: OrderItem[];
  pickup_time?: string;
  pickup_location?: string;
  delivery_address?: string;
  delivery_time_slot?: string;
  fulfillment_type?: 'pickup' | 'delivery';
  payment_proof_url?: string;
}
