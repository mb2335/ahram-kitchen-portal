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
    pickupDetail,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    setIsUploading(true);

    try {
      console.log('Starting order submission with items:', items);
      
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

        console.log('Processing category items:', categoryItems);

        // Calculate category total with discounts applied
        const categoryTotal = categoryItems.reduce((sum, item) => {
          const originalPrice = item.price * item.quantity;
          const discountAmount = item.discount_percentage 
            ? (originalPrice * (item.discount_percentage / 100))
            : 0;
          console.log('Item calculation:', {
            item: item.name,
            originalPrice,
            discountAmount,
            finalPrice: originalPrice - discountAmount
          });
          return sum + (originalPrice - discountAmount);
        }, 0);
        
        const categoryTaxAmount = categoryTotal * (taxAmount / total);

        const { data: categoryData, error: categoryError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (categoryError) throw categoryError;

        const category = categoryData;
        const needsCustomPickup = category?.has_custom_pickup ?? false;

        const orderData = {
          customer_id: customerId,
          total_amount: categoryTotal + categoryTaxAmount,
          tax_amount: categoryTaxAmount,
          notes: notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: uploadData.path,
          pickup_time: needsCustomPickup ? pickupDetail?.time : null,
          pickup_location: needsCustomPickup ? pickupDetail?.location : null,
        };

        console.log('Creating order with data:', orderData);

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items with correct discounted prices
        const orderItems = categoryItems.map((item) => {
          // Calculate the discounted unit price if applicable
          const unitPrice = item.price * (1 - (item.discount_percentage || 0) / 100);

          console.log('Creating order item:', {
            itemName: item.name,
            originalPrice: item.price,
            discountPercentage: item.discount_percentage || 0,
            calculatedUnitPrice: unitPrice
          });

          const orderItem = {
            order_id: insertedOrder.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice,
          };

          return orderItem;
        });

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        return insertedOrder;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      await updateMenuItemQuantities(items);
      onOrderSuccess(validOrders[0].id);

      const firstOrder = validOrders[0];
      
      navigate('/thank-you', {
        state: {
          orderDetails: {
            id: firstOrder.id,
            items: items.map(item => ({
              name: item.name,
              nameKo: item.nameKo,
              quantity: item.quantity,
              price: item.price,
              discount_percentage: item.discount_percentage
            })),
            total: total + taxAmount,
            taxAmount: taxAmount,
            createdAt: firstOrder.created_at,
            pickupTime: firstOrder.pickup_time,
            pickupLocation: firstOrder.pickup_location
          }
        },
        replace: true
      });

    } catch (error: any) {
      console.error('Order submission error:', error);
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