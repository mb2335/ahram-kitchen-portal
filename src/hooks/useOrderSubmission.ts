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
    console.log('Starting order submission with:', {
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
      console.log('Validating item IDs...');
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid items found:', invalidItems);
        throw new Error('Invalid menu item IDs detected');
      }

      console.log('Getting or creating customer...');
      const customerId = await getOrCreateCustomer(customerData, session?.user?.id);
      console.log('Customer ID:', customerId);

      console.log('Uploading payment proof...');
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      console.log('Payment proof uploaded:', uploadData.path);

      console.log('Creating orders for each category...');
      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        console.log('Processing category:', categoryId);
        console.log('Delivery date:', deliveryDate);
        
        const pickupDetail = pickupDetails[categoryId];
        console.log('Using pickup detail for category:', categoryId, pickupDetail);
        
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total);
        
        const orderData = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: pickupDetail?.time || null,
          pickup_location: pickupDetail?.location || null
        };

        console.log('Creating order with data:', orderData);

        const { data: insertResult, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        console.log('Order created:', insertResult);

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

        if (orderItemsError) {
          console.error('Order items creation error:', orderItemsError);
          throw orderItemsError;
        }

        return insertResult;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      console.log('Updating menu item quantities...');
      await updateMenuItemQuantities(items);
      
      console.log('Order submission successful');
      onOrderSuccess(validOrders[0].id);
      
      const firstOrder = validOrders[0];
      const thankYouPageData = {
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
        pickupTime: firstOrder.pickup_time,
        pickupLocation: firstOrder.pickup_location
      };
      
      console.log('Navigating to thank you page with data:', thankYouPageData);

      navigate('/thank-you', {
        state: {
          orderDetails: thankYouPageData
        },
        replace: true
      });
    } catch (error: any) {
      console.error('Error in order submission:', error);
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