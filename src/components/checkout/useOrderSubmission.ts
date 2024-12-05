import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { getOrCreateCustomer } from './services/customerService';
import { createOrder, uploadPaymentProof } from './services/orderService';

interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
}

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
}

interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDate: Date;
  customerData?: CustomerData;
  onOrderSuccess: (orderId: string) => void;
}

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDate,
    customerData,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    setIsUploading(true);
    console.log('Starting order submission process');

    try {
      // Validate all item IDs are proper UUIDs
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid menu item IDs:', invalidItems);
        throw new Error('Invalid menu item IDs detected');
      }

      const customerId = await getOrCreateCustomer(session, customerData);
      console.log('Customer ID obtained:', customerId);

      // Upload payment proof
      const paymentProofPath = await uploadPaymentProof(paymentProof);

      // Create order
      const orderId = await createOrder({
        customerId,
        items,
        total,
        taxAmount,
        notes,
        deliveryDate,
        paymentProofPath
      });

      onOrderSuccess(orderId);

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}