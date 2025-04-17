import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { OrderSubmissionProps } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { usePaymentProofUpload } from '@/hooks/order/usePaymentProofUpload';
import { format } from 'date-fns';

export const useOrderSubmission = () => {
  const { toast } = useToast();
  const session = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const { uploadPaymentProof } = usePaymentProofUpload();

  const submitOrder = async (props: OrderSubmissionProps, paymentProofFile: File) => {
    try {
      setIsUploading(true);
      
      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(paymentProofFile);
      
      // Create or get customer
      const customerId = await getOrCreateCustomer(props.customerData);
      
      // Group items by category
      const itemsByCategory = props.items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(item);
        return acc;
      }, {} as Record<string, typeof props.items>);
      
      const categoryIds = Object.keys(itemsByCategory);
      const orderIds: string[] = [];
      
      // Create one order per category
      for (const categoryId of categoryIds) {
        const items = itemsByCategory[categoryId];
        const deliveryDate = props.deliveryDates[categoryId];
        
        if (!deliveryDate) {
          throw new Error(`Missing delivery date for category ${categoryId}`);
        }
        
        // Determine fulfillment type for this category
        const categoryFulfillmentType = props.categoryFulfillmentTypes?.[categoryId] || props.fulfillmentType;
        
        // Calculate total for this category
        const categoryTotal = items.reduce((sum, item) => {
          const price = item.price;
          let itemTotal = price * item.quantity;
          
          if (item.discount_percentage) {
            const discountAmount = itemTotal * (item.discount_percentage / 100);
            itemTotal -= discountAmount;
          }
          
          return sum + itemTotal;
        }, 0);
        
        const categoryTaxAmount = (categoryTotal / props.total) * props.taxAmount;
        const totalAmount = categoryTotal + categoryTaxAmount;
        
        // Check if we need to book a delivery time slot
        let deliveryTimeSlot = null;
        if (categoryFulfillmentType === 'delivery') {
          // Get the selected time slot for this category
          const timeSlotId = `timeSlot_${categoryId}`;
          const timeSlotData = window.localStorage?.getItem(timeSlotId);
          
          if (timeSlotData) {
            try {
              const { timeSlot } = JSON.parse(timeSlotData);
              if (timeSlot) {
                // Check if time slot is available
                const deliveryDateStr = format(deliveryDate, 'yyyy-MM-dd');
                
                const { data: existingBookings } = await supabase
                  .from('delivery_time_bookings')
                  .select('id')
                  .eq('category_id', categoryId)
                  .eq('delivery_date', deliveryDateStr)
                  .eq('time_slot', timeSlot);
                
                if (existingBookings && existingBookings.length > 0) {
                  throw new Error(`The selected delivery time slot is no longer available. Please select another time.`);
                }
                
                deliveryTimeSlot = timeSlot;
              }
            } catch (err) {
              console.error('Error parsing time slot data', err);
            }
          }
          
          // If we need a time slot but don't have one, check if there are any delivery settings for this day
          if (!deliveryTimeSlot) {
            const dayOfWeek = deliveryDate.getDay();
            
            const { data: daySettings } = await supabase
              .from('delivery_settings')
              .select('*')
              .eq('day_of_week', dayOfWeek)
              .eq('active', true);
            
            if (!daySettings || daySettings.length === 0) {
              throw new Error(`No delivery times are available for the selected date. Please choose another date.`);
            }
          }
        }
        
        // Create the order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            total_amount: totalAmount,
            tax_amount: categoryTaxAmount,
            delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
            notes: props.notes,
            payment_proof_url: paymentProofUrl,
            pickup_time: props.pickupDetail?.time,
            pickup_location: props.pickupDetail?.location,
            fulfillment_type: categoryFulfillmentType,
            delivery_address: props.customerData.address,
            delivery_time_slot: deliveryTimeSlot
          })
          .select('id')
          .single();
          
        if (orderError) {
          throw new Error(`Failed to create order: ${orderError.message}`);
        }
        
        const orderId = orderData.id;
        orderIds.push(orderId);
        
        // Create order items
        for (const item of items) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              menu_item_id: item.id,
              quantity: item.quantity,
              unit_price: item.price
            });
            
          if (itemError) {
            throw new Error(`Failed to create order item: ${itemError.message}`);
          }
        }
        
        // If this is a delivery order with a selected time slot, book it
        if (categoryFulfillmentType === 'delivery' && deliveryTimeSlot) {
          const { error: bookingError } = await supabase
            .from('delivery_time_bookings')
            .insert({
              order_id: orderId,
              category_id: categoryId,
              delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
              time_slot: deliveryTimeSlot
            });
            
          if (bookingError) {
            throw new Error(`Failed to book delivery time slot: ${bookingError.message}`);
          }
        }
      }
      
      // Call the success callback with the first order ID (or all IDs in the future)
      props.onOrderSuccess(orderIds[0]);
      
      return orderIds[0];
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateCustomer = async (customerData: OrderSubmissionProps['customerData']) => {
    // If the user is logged in, get their customer ID
    if (session?.user) {
      const { data: existingCustomer, error } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
        
      if (!error && existingCustomer) {
        return existingCustomer.id;
      }
    }
    
    // Otherwise check if a customer with this email exists
    const { data: existingCustomerByEmail } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerData.email)
      .single();
      
    if (existingCustomerByEmail) {
      // Update customer info
      await supabase
        .from('customers')
        .update({
          full_name: customerData.fullName,
          phone: customerData.phone
        })
        .eq('id', existingCustomerByEmail.id);
        
      return existingCustomerByEmail.id;
    }
    
    // Create a new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        user_id: session?.user?.id || null,
        full_name: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone
      })
      .select('id')
      .single();
      
    if (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
    
    return newCustomer.id;
  };

  return {
    submitOrder,
    isUploading
  };
};
