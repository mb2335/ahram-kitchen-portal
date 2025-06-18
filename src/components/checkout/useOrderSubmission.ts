
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

  const submitOrder = async (props: OrderSubmissionProps, paymentProofFile: File | null, deliveryTimeSlot?: string) => {
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
        pickupTime: props.pickupTime,
        deliveryTimeSlot: deliveryTimeSlot,
        total: props.total,
        items: props.items.map(item => ({ id: item.id, name: item.name, category_id: item.category_id }))
      });
      
      // Validate required customer data
      if (!props.customerData.fullName || !props.customerData.email) {
        throw new Error("Customer name and email are required");
      }

      if (!props.customerData.smsOptIn) {
        throw new Error("You must agree to receive SMS updates to place an order");
      }

      // Additional validation for delivery orders with time slots
      if (props.fulfillmentType === 'delivery' && deliveryTimeSlot) {
        const deliveryDate = Object.values(props.deliveryDates)[0] || new Date();
        const formattedDate = deliveryDate.toISOString().split('T')[0];
        
        // Check if the time slot is still available
        const { data: existingBooking, error: checkError } = await supabase
          .from('delivery_time_bookings')
          .select('id')
          .eq('delivery_date', formattedDate)
          .eq('time_slot', deliveryTimeSlot)
          .maybeSingle();
        
        if (checkError) {
          console.error('Error checking time slot availability:', checkError);
          throw new Error('Failed to verify time slot availability');
        }
        
        if (existingBooking) {
          throw new Error('This time slot has already been booked. Please select another time slot.');
        }
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
        pickup_time: props.pickupTime || null,
        delivery_time_slot: deliveryTimeSlot || null,
        customer_name: props.customerData.fullName,
        customer_email: props.customerData.email,
        customer_phone: props.customerData.phone || null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        status: 'pending'
      };

      console.log("Creating order with delivery time slot:", { 
        pickup_time: props.pickupTime,
        delivery_time_slot: deliveryTimeSlot
      });

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

      // Create delivery time slot booking if this is a delivery order with a time slot
      if (props.fulfillmentType === 'delivery' && deliveryTimeSlot && order.id) {
        const formattedDate = deliveryDate.toISOString().split('T')[0];
        
        console.log("Creating delivery time slot booking:", {
          delivery_date: formattedDate,
          time_slot: deliveryTimeSlot,
          order_id: order.id,
          customer_name: props.customerData.fullName
        });
        
        const { error: bookingError } = await supabase
          .from('delivery_time_bookings')
          .insert({
            delivery_date: formattedDate,
            time_slot: deliveryTimeSlot,
            order_id: order.id,
            customer_name: props.customerData.fullName,
            customer_phone: props.customerData.phone || null
          });
        
        if (bookingError) {
          console.error("Error creating time slot booking:", bookingError);
          // Don't fail the order, but log the issue
          console.warn("Order created successfully but time slot booking failed");
        } else {
          console.log("Time slot booking created successfully");
        }
      }

      // Create order items - PRESERVE CATEGORY INFORMATION
      console.log("Creating order items with category preservation...");
      const orderItems = props.items.map((item) => {
        const orderItem = {
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          discount_percentage: item.discount_percentage || null
        };
        
        console.log(`Creating order item: ${item.name} (category_id: ${item.category_id})`);
        return orderItem;
      });

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) {
        console.error("Error creating order items:", orderItemsError);
        throw orderItemsError;
      }

      console.log("Successfully created order items with category preservation");

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
              unit_price,
              discount_percentage,
              menu_item:menu_items (
                id,
                name,
                name_ko,
                category_id,
                category:menu_categories(
                  id,
                  name,
                  name_ko
                )
              )
            )
          `)
          .eq('id', order.id)
          .single();

        if (!fetchError && completeOrder) {
          console.log("Order with category data for notification:", completeOrder);
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
