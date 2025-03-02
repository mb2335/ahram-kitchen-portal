
import { PickupDetail } from "./pickup";

export interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
  category_id?: string;
  discount_percentage?: number | null;
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
    address?: string; // For delivery orders
  };
  pickupDetail: PickupDetail | null;
  fulfillmentType: string;
  onOrderSuccess: (orderId: string) => void;
}

export interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  delivery_date: string;
  notes?: string;
  customer_id: string;
  pickup_time?: string;
  pickup_location?: string;
  payment_proof_url: string;
  tax_amount: number;
  fulfillment_type?: string;
  created_at: string;
  rejection_reason?: string;
  delivery_address?: string; // Added for delivery orders
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
  delivery_address?: string; // Added for delivery orders
}

// Fulfillment types
export const FULFILLMENT_TYPE_PICKUP = 'pickup';
export const FULFILLMENT_TYPE_DELIVERY = 'delivery';

// Error messages for invalid selections
export const ERROR_MESSAGES = {
  PICKUP_INVALID_DAY: 'Pickup is only available on selected pickup days.',
  DELIVERY_INVALID_DAY: 'Delivery is not available on pickup days.',
  PICKUP_LOCATION_REQUIRED: 'Please select a pickup location and time.',
  DELIVERY_ADDRESS_REQUIRED: 'Please provide a delivery address.'
};
