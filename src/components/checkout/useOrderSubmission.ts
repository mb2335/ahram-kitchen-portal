
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
          
          // If we need a time slot but don't have one, check if there are any delivery schedules for this day
          if (!deliveryTimeSlot) {
            const dayOfWeek = deliveryDate.getDay();
            
            const { data: scheduleData } = await supabase
              .from('delivery_schedules')
              .select('id')
              .eq('category_id', categoryId)
              .eq('day_of_week', dayOfWeek)
              .eq('active', true);
              
            if (scheduleData && scheduleData.length > 0) {
              throw new Error(`Please select a delivery time slot.`);
            }
          }
        }
        
        // Create the order
        const orderData: any = {
          customer_id: customerId,
          total_amount: totalAmount,
          tax_amount: categoryTaxAmount,
          notes: props.notes,
          status: 'pending',
          delivery_date: deliveryDate.toISOString(),
          payment_proof_url: paymentProofUrl,
          fulfillment_type: categoryFulfillmentType,
          delivery_time_slot: deliveryTimeSlot,
        };
        
        // Add pickup details if applicable
        if (categoryFulfillmentType === 'pickup' && props.pickupDetail) {
          orderData.pickup_time = props.pickupDetail.time;
          orderData.pickup_location = props.pickupDetail.location;
        }
        
        // Add delivery address if applicable
        if (categoryFulfillmentType === 'delivery' && props.customerData.address) {
          orderData.delivery_address = props.customerData.address;
        }
        
        // Insert the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
          
        if (orderError) throw orderError;
        
        // Store the order ID
        orderIds.push(order.id);
        
        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) throw itemsError;
        
        // Book the delivery time slot if applicable
        if (deliveryTimeSlot) {
          const bookingData = {
            order_id: order.id,
            category_id: categoryId,
            delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
            time_slot: deliveryTimeSlot,
          };
          
          const { error: bookingError } = await supabase
            .from('delivery_time_bookings')
            .insert(bookingData);
            
          if (bookingError) throw bookingError;
        }
      }
      
      // Clear any saved time slots
      if (window.localStorage) {
        categoryIds.forEach(categoryId => {
          window.localStorage.removeItem(`timeSlot_${categoryId}`);
        });
      }
      
      // Return the first order ID (for compatibility with existing code)
      if (orderIds.length) {
        props.onOrderSuccess(orderIds[0]);
      }
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Order Submission Error',
        description: error.message || 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  const getOrCreateCustomer = async (customerData: OrderSubmissionProps['customerData']) => {
    try {
      // For logged in users, find their customer record
      if (session?.user?.id) {
        const { data: customer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();
          
        if (!error && customer) return customer.id;
        
        // If customer not found, create one
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert([{
            user_id: session.user.id,
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone,
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        return newCustomer.id;
      } else {
        // For guest users, find by email
        const { data: customer, error } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customerData.email)
          .maybeSingle();
          
        if (!error && customer) return customer.id;
        
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert([{
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone,
          }])
          .select()
          .single();
          
        if (createError) throw createError;
        return newCustomer.id;
      }
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  };
  
  return {
    submitOrder,
    isUploading
  };
};
