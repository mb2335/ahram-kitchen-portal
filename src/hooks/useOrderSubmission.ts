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
    pickupDetails,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    console.log('[useOrderSubmission] Starting order submission with data:', {
      items,
      total,
      taxAmount,
      notes,
      deliveryDates,
      customerData,
      pickupDetails
    });

    setIsUploading(true);

    try {
      console.log('[useOrderSubmission] Calling debug-order-submission function');
      const { data: debugData, error: debugError } = await supabase.functions.invoke('debug-order-submission', {
        body: {
          items,
          total,
          taxAmount,
          notes,
          deliveryDates,
          customerData,
          pickupDetails,
          paymentProofName: paymentProof.name
        }
      });

      console.log('[useOrderSubmission] Debug function response:', { debugData, debugError });

      if (debugError) {
        console.error('[useOrderSubmission] Debug function error:', debugError);
        throw new Error('Debug function failed: ' + debugError.message);
      }

      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        console.error('[useOrderSubmission] Invalid item IDs detected:', invalidItems);
        throw new Error('Invalid menu item IDs detected');
      }

      console.log('[useOrderSubmission] Creating/getting customer');
      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);
      console.log('[useOrderSubmission] Customer ID:', customerId);

      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      console.log('[useOrderSubmission] Uploading payment proof');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[useOrderSubmission] Payment proof upload error:', uploadError);
        throw uploadError;
      }

      console.log('[useOrderSubmission] Payment proof uploaded successfully:', uploadData.path);

      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total);

        const categoryPickupDetails = pickupDetails[categoryId];
        console.log('[useOrderSubmission] Processing category order:', {
          categoryId,
          deliveryDate: deliveryDate.toISOString(),
          pickupDetails: categoryPickupDetails,
          itemsCount: categoryItems.length,
          categoryTotal,
          categoryTaxAmount
        });

        const orderData = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: categoryPickupDetails?.time || null,
          pickup_location: categoryPickupDetails?.location || null,
        };

        console.log('[useOrderSubmission] Inserting order with data:', orderData);

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          console.error('[useOrderSubmission] Order insertion error:', orderError);
          throw orderError;
        }

        console.log('[useOrderSubmission] Order created successfully:', insertedOrder);

        const orderItems = categoryItems.map((item) => ({
          order_id: insertedOrder.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        console.log('[useOrderSubmission] Creating order items:', orderItems);

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) {
          console.error('[useOrderSubmission] Order items insertion error:', orderItemsError);
          throw orderItemsError;
        }

        return insertedOrder;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      console.log('[useOrderSubmission] All orders created successfully:', validOrders);

      await updateMenuItemQuantities(items);
      onOrderSuccess(validOrders[0].id);

      const firstOrder = validOrders[0];
      const firstCategoryId = Object.keys(deliveryDates)[0];
      const firstPickupDetail = pickupDetails[firstCategoryId];

      console.log('[useOrderSubmission] Navigating to thank you page with:', {
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
            pickupTime: firstPickupDetail?.time || null,
            pickupLocation: firstPickupDetail?.location || null
          }
        },
        replace: true
      });

    } catch (error: any) {
      console.error('[useOrderSubmission] Error during order submission:', error);
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
