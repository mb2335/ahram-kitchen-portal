import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSubmissionProps } from '@/types/order';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDates,
    customerData,
    onOrderSuccess,
    pickupDetails
  }: OrderSubmissionProps, paymentProof: File) => {
    console.log('[useOrderSubmission] Starting submission with:', {
      items,
      pickupDetails,
      deliveryDates
    });
    
    setIsUploading(true);

    try {
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);
      
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total);
        
        const pickupDetail = pickupDetails[categoryId];
        console.log('[useOrderSubmission] Creating order for category:', {
          categoryId,
          pickupDetail,
          deliveryDate: deliveryDate.toISOString()
        });
        
        if (!pickupDetail) {
          console.warn('[useOrderSubmission] No pickup detail found for category:', categoryId);
        }

        const orderData = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: pickupDetail?.time,
          pickup_location: pickupDetail?.location
        };

        console.log('[useOrderSubmission] Order data to insert:', orderData);

        const { data: insertResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          console.error('[useOrderSubmission] Order creation failed:', orderError);
          throw orderError;
        }

        console.log('[useOrderSubmission] Order created:', insertResult);

        const orderItems = categoryItems.map((item) => ({
          order_id: insertResult.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        return insertResult;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      await updateMenuItemQuantities(items);
      onOrderSuccess(validOrders[0].id);
      
      const firstOrder = validOrders[0];
      const firstCategoryId = Object.keys(deliveryDates)[0];
      const firstPickupDetail = pickupDetails[firstCategoryId];

      console.log('[useOrderSubmission] Order successful, navigating to thank you with:', {
        orderId: firstOrder.id,
        pickupDetails: firstPickupDetail
      });

      navigate('/thank-you', {
        state: {
          orderDetails: {
            id: firstOrder.id,
            items: items.map(item => ({
              name: item.name,
              nameKo: item.nameKo,
              quantity: item.quantity,
              price: item.price
            })),
            total: total + taxAmount,
            taxAmount: taxAmount,
            createdAt: firstOrder.created_at,
            pickupTime: firstPickupDetail?.time,
            pickupLocation: firstPickupDetail?.location
          }
        },
        replace: true
      });
    } catch (error: any) {
      console.error('[useOrderSubmission] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}