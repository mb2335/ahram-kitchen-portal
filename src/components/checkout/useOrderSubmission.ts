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
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
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

      // Upload payment proof with unique filename
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create orders for each delivery date
      const orderPromises = Object.entries(deliveryDates).map(async ([categoryId, deliveryDate]) => {
        const categoryItems = items.filter(item => item.category_id === categoryId);
        if (categoryItems.length === 0) return null;

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const categoryTaxAmount = categoryTotal * (taxAmount / total); // Proportional tax amount

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([
            {
              customer_id: customerId,
              total_amount: categoryTotal + categoryTaxAmount,
              tax_amount: categoryTaxAmount,
              notes: notes,
              status: 'pending',
              delivery_date: deliveryDate.toISOString(),
              payment_proof_url: uploadData.path,
            },
          ])
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items for this category
        const orderItems = categoryItems.map((item) => ({
          order_id: orderData.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;

        return orderData;
      });

      const orders = await Promise.all(orderPromises);
      const validOrders = orders.filter(Boolean);

      if (validOrders.length === 0) {
        throw new Error('No valid orders could be created');
      }

      // Update menu item quantities
      await updateMenuItemQuantities(items);

      // Call onOrderSuccess with the first order ID (we can enhance this later if needed)
      onOrderSuccess(validOrders[0].id);
      
      // Navigate to thank you page with order details
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
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}