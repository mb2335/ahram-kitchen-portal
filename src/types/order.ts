import { PickupDetail } from '@/components/vendor/menu/types/category';

export interface OrderSubmissionProps {
  items: Array<{
    id: string;
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
    category_id?: string;
  }>;
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDates: Record<string, Date>;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
  onOrderSuccess: (orderId: string) => void;
  pickupDetails: Record<string, PickupDetail>;
}