
import { Order } from '@/components/vendor/types';

export interface CategoryFulfillmentDetail {
  categoryId: string;
  categoryName: string;
  categoryNameKo?: string;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryDate: string;
  deliveryAddress?: string;
  deliveryTimeSlot?: string;
  pickupTime?: string;
  pickupLocation?: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    nameKo?: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
  }>;
  subtotal: number;
}

export interface UnifiedOrder {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  createdAt: string;
  overallStatus: string;
  notes?: string;
  paymentProofUrl: string;
  rejectionReason?: string;
  categoryDetails: CategoryFulfillmentDetail[];
  relatedOrderIds: string[];
}

export interface OrderGroup {
  unifiedOrder: UnifiedOrder;
  originalOrders: Order[];
}
