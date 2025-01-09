import { CustomerData } from './customer';
import { PickupDetail } from './pickup';

export interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
  category_id?: string;
  discount_percentage?: number;
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
  pickupDetail: PickupDetail | null;
}