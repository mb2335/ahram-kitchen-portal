import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSubmissionProps } from '@/types/order';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';
import { Json } from '@/integrations/supabase/types';

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

      console.log('Processing orders with pickup details:', JSON.stringify(pickupDetails, null, 2));

      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total);

        // Ensure pickup details are properly structured as a JSON object
        const pickupDetailsForCategory = pickupDetails[categoryId];
        console.log('Raw pickup details for category:', categoryId, JSON.stringify(pickupDetailsForCategory, null, 2));

        const pickupDetailsJson = pickupDetailsForCategory ? {
          time: String(pickupDetailsForCategory.time),
          location: String(pickupDetailsForCategory.location)
        } : null;

        console.log('Formatted pickup details JSON:', JSON.stringify(pickupDetailsJson, null, 2));

        // Create the order with explicit JSON handling
        const orderData = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_details: pickupDetailsJson as Json
        };

        console.log('Inserting order with data:', JSON.stringify(orderData, null, 2));

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select('*, pickup_details')
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        console.log('Order created successfully:', {
          orderId: order.id,
          pickupDetails: order.pickup_details
        });

        // Double-check the saved data
        const { data: verifyOrder, error: verifyError } = await supabase
          .from('orders')
          .select('pickup_details')
          .eq('id', order.id)
          .single();

        if (verifyError) {
          console.error('Error verifying order:', verifyError);
        } else {
          console.log('Verified pickup details in database:', JSON.stringify(verifyOrder.pickup_details, null, 2));
        }

        const orderItems = categoryItems.map((item) => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        return order;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      await updateMenuItemQuantities(items);

      onOrderSuccess(validOrders[0].id);
      
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
            createdAt: validOrders[0].created_at,
            pickupDetails: validOrders[0].pickup_details
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
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}