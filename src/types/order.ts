
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
  notes: string;
  deliveryDates: Record<string, Date>;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    smsOptIn: boolean;
    address?: string;
  };
  pickupDetail: null; // Simplified - no pickup details needed
  pickupTime?: string | null; // Add pickup time field
  fulfillmentType: 'pickup' | 'delivery'; // Simplified to only two options
  onOrderSuccess: (orderId: string, isAuthenticated: boolean) => void;
}

export interface OrderData {
  id: string;
  total_amount: number;
  status: string;
  delivery_date: string;
  notes?: string;
  customer_id?: string | null;
  payment_proof_url: string;
  discount_amount?: number;
  fulfillment_type: 'pickup' | 'delivery';
  created_at: string;
  rejection_reason?: string;
  delivery_address?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

export interface OrderHistoryItem {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  delivery_date: string;
  rejection_reason?: string;
  fulfillment_type: 'pickup' | 'delivery';
  delivery_address?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
}

// Fulfillment types
export const FULFILLMENT_TYPE_PICKUP = 'pickup';
export const FULFILLMENT_TYPE_DELIVERY = 'delivery';
