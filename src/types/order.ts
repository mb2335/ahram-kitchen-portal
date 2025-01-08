import { CustomerData } from './customer';
import { PickupDetail } from './pickup';

export interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
  category_id?: string;
  category?: {
    id: string;
    name: string;
    has_custom_pickup: boolean;
    pickup_details?: PickupDetail[];
  };
}

export interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDates: Record<string, Date>;
  customerData: CustomerData;
  onOrderSuccess: (orderId: string) => void;
  pickupDetails: Record<string, PickupDetail>;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  tax_amount: number;
  status: string;
  notes?: string;
  delivery_date: string;
  payment_proof_url: string;
  rejection_reason?: string;
  created_at: string;
  pickup_details?: PickupDetail;
}