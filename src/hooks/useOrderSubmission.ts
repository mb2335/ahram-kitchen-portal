import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { OrderSubmissionProps } from '@/types/order';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';
import { usePaymentProofUpload } from './order/usePaymentProofUpload';
import { createOrder } from './order/useOrderCreation';
import { useSession } from '@supabase/auth-helpers-react';

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadPaymentProof, isUploading } = usePaymentProofUpload();

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDates,
    customerData,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    try {
      // Validate all item IDs are proper UUIDs
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      // Get or create customer
      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);

      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(paymentProof);

      // Create orders for each delivery date
      const orderPromises = Object.entries(deliveryDates).map(([categoryId, deliveryDate]) =>
        createOrder({
          customerId,
          categoryId,
          deliveryDate,
          items,
          total,
          taxAmount,
          notes,
          paymentProofUrl,
        })
      );

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      // Update menu item quantities
      await updateMenuItemQuantities(items);

      // Call onOrderSuccess with the first order ID
      onOrderSuccess(validOrders[0].id);
      
      // Navigate to thank you page
      navigate('/thank-you', {
        state: {
          orderDetails: {
            id: validOrders[0].id,
            items: items.map(item => ({
              name: item.name,
              nameKo: item.nameKo,
              quantity: item.quantity,
              price: item.price
            })),
            total: total + taxAmount,
            taxAmount: taxAmount,
            createdAt: validOrders[0].created_at
          }
        },
        replace: true
      });
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
    }
  };

  return {
    submitOrder,
    isUploading
  };
}