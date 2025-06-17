
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { OrderSubmissionProps } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { usePaymentProofUpload } from '@/hooks/order/usePaymentProofUpload';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';
import { getOrCreateCustomer } from '@/utils/customerManagement';

export const useOrderSubmission = () => {
  const { toast } = useToast();
  const session = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadPaymentProof } = usePaymentProofUpload();

  const submitOrder = async (props: OrderSubmissionProps, paymentProofFile: File | null) => {
    try {
      if (!paymentProofFile) {
        throw new Error("Payment proof is required");
      }
      
      setIsUploading(true);
      setIsSubmitting(true);
      
      console.log("Starting simplified order submission:", { 
        customerData: props.customerData,
        itemCount: props.items.length,
        fulfillmentType: props.fulfillmentType,
        total: props.total
      });
      
      // Validate required customer data
      if (!props.customerData.fullName || !props.customerData.email) {
        throw new Error("Customer name and email are required");
      }

      if (!props.customerData.smsOptIn) {
        throw new Error("You must agree to receive SMS updates to place an order");
      }
      
      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(paymentProofFile);
      console.log("Payment proof uploaded successfully");
      
      // Get or create customer record for authenticated users
      const customerId = session?.user?.id ? 
        await getOrCreateCustomer({
          ...props.customerData,
          smsOptIn: true
        }, session.user.id) : null;
      
      console.log("Customer ID obtained:", customerId);
      
      // Get delivery date
      const deliveryDate = Object.values(props.deliveryDates)[0] || new Date();
      
      // Calculate total with discounts
      const total = props.items.reduce((sum, item) => {
        const price = item.discount_percentage 
          ? item.price * (1 - item.discount_percentage / 100) 
          : item.price;
        return sum + price * item.quantity;
      }, 0);

      // Calculate discount amount
      const discountAmount = props.items.reduce((sum, item) => {
        if (!item.discount_percentage) return sum;
        const itemTotal = item.price * item.quantity;
        return sum + (itemTotal * (item.discount_percentage / 100));
      }, 0);

      // Create single order
      const orderData = {
        customer_id: customerId,
        total_amount: total,
        notes: props.notes,
        delivery_date: deliveryDate.toISOString(),
        payment_proof_url: paymentProofUrl,
        fulfillment_type: props.fulfillmentType,
        delivery_address: props.customerData.address || null,
        customer_name: props.customerData.fullName,
        customer_email: props.customerData.email,
        customer_phone: props.customerData.phone || null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        status: 'pending'
      };

      console.log("Creating order with data:", orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Successfully created order:", order);

      // Create order items
      const orderItems = props.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percentage: item.discount_percentage || null
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) {
        console.error("Error creating order items:", orderItemsError);
        throw orderItemsError;
      }

      console.log("Successfully created order items");

      // Send notification
      try {
        const { data: completeOrder, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              menu_item_id,
              menu_item:menu_items (
                id,
                name,
                name_ko
              )
            )
          `)
          .eq('id', order.id)
          .single();

        if (!fetchError && completeOrder) {
          await supabase.functions.invoke('send-sms', {
            body: {
              type: 'order_status_update',
              order: completeOrder,
              previousStatus: null
            }
          });
          console.log("Order notification sent");
        }
      } catch (notificationError) {
        console.warn("Error sending notification, but order was created:", notificationError);
      }
      
      // Update item quantities
      try {
        await updateMenuItemQuantities(props.items);
        console.log("Menu item quantities updated successfully");
      } catch (qtyError) {
        console.warn("Error updating menu item quantities, but order was created:", qtyError);
      }

      // Call success callback
      const isAuthenticated = !!session?.user;
      console.log(`Order submission completed successfully. Order ID: ${order.id}`);
      props.onOrderSuccess(order.id, isAuthenticated);
      
      return order.id;
    } catch (error: any) {
      console.error("Order submission failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return {
    submitOrder,
    isUploading,
    isSubmitting
  };
};
