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
    console.log('Starting order submission with pickup details:', pickupDetails);
    setIsUploading(true);

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
      console.log('Customer ID retrieved:', customerId);

      // Upload payment proof with unique filename
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      console.log('Uploading payment proof:', fileName);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      console.log('Payment proof uploaded successfully:', uploadData.path);

      // Create orders for each delivery date
      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        console.log('Processing order for category:', categoryId);
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total);

        // Get pickup details for this category
        const pickupDetailsForCategory = pickupDetails[categoryId];
        console.log('Raw pickup details for category:', {
          categoryId,
          pickupDetails: pickupDetailsForCategory
        });

        // Simplify to basic time/location object
        const simplifiedPickupDetails = pickupDetailsForCategory ? {
          time: pickupDetailsForCategory.time,
          location: pickupDetailsForCategory.location
        } : null;

        console.log('Simplified pickup details:', simplifiedPickupDetails);

        const orderPayload = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_details: simplifiedPickupDetails
        };

        console.log('Submitting order with payload:', orderPayload);

        const { data: insertResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderPayload])
          .select('*, pickup_details')
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        if (!insertResult) {
          console.error('No order data returned after insertion');
          throw new Error('No order data returned after insertion');
        }

        console.log('Order created successfully:', insertResult);

        // Verify the saved pickup details
        const { data: verifiedOrder, error: verifyError } = await supabase
          .from('orders')
          .select('id, pickup_details')
          .eq('id', insertResult.id)
          .single();

        if (verifyError) {
          console.error('Error verifying order:', verifyError);
        } else {
          console.log('Verified pickup details in database:', {
            orderId: verifiedOrder.id,
            pickupDetails: verifiedOrder.pickup_details
          });
        }

        // Create order items
        const orderItems = categoryItems.map((item) => ({
          order_id: insertResult.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        console.log('Creating order items:', orderItems);

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        console.log('Order items created successfully');

        return insertResult;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      console.log('All orders created successfully:', validOrders);

      await updateMenuItemQuantities(items);
      console.log('Menu item quantities updated');

      onOrderSuccess(validOrders[0].id);
      
      // Navigate to thank you page with verified pickup details
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