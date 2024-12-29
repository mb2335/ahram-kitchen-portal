import { CustomerData } from './customer';

export interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
  category_id?: string;
}

export interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDates: Record<string, Date>;
  customerData: CustomerData;
  onOrderSuccess: (orderId: string) => void;
}