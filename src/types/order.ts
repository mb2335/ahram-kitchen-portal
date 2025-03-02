
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
}
