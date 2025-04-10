
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { OrderSubmissionProps } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from '@/types/order';

export function useOrderSubmission() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const submitOrder = async (
    {
      items,
      total,
      taxAmount,
      notes,
      deliveryDates,
      customerData,
      pickupDetail,
      fulfillmentType,
      categoryFulfillmentTypes = {},
      timeSlots = {},
      onOrderSuccess
    }: OrderSubmissionProps,
    paymentProof: File
  ) => {
    setIsUploading(true);

    try {
      // Upload payment proof
      const fileName = `${Date.now()}_${paymentProof.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw new Error(`Error uploading payment: ${uploadError.message}`);

      const paymentProofUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/payment_proofs/${fileName}`;

      // Get or create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (customerError && customerError.code !== 'PGRST116') {
        throw new Error(`Error finding customer: ${customerError.message}`);
      }

      let customerId;
      if (!customer) {
        // Create customer if not exists
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone,
          })
          .select('id')
          .single();

        if (createError) throw new Error(`Error creating customer: ${createError.message}`);
        customerId = newCustomer.id;
      } else {
        customerId = customer.id;
      }

      // Create orders by category if needed
      const categoryIds = [...new Set(items.map(item => item.category_id))];
      const orderIds: string[] = [];

      for (const categoryId of categoryIds) {
        if (!categoryId) continue;

        const categoryItems = items.filter(item => item.category_id === categoryId);
        const deliveryDate = deliveryDates[categoryId];
        
        if (!deliveryDate) {
          throw new Error(`Missing delivery date for category ${categoryId}`);
        }

        const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
        const dateString = format(deliveryDate, 'yyyy-MM-dd');
        
        // Create the order
        const orderData: any = {
          customer_id: customerId,
          total_amount: categoryItems.reduce((acc, item) => {
            const price = item.discount_percentage 
              ? item.price * (1 - item.discount_percentage / 100) 
              : item.price;
            return acc + (price * item.quantity);
          }, 0),
          tax_amount: taxAmount * (categoryItems.reduce((acc, item) => 
            acc + (item.price * item.quantity), 0) / total),
          notes,
          status: 'pending',
          delivery_date: dateString,
          payment_proof_url: paymentProofUrl,
          fulfillment_type: categoryFulfillment,
        };

        // Add delivery-specific or pickup-specific fields
        if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY) {
          orderData.delivery_address = customerData.address;
          
          // Add time slot if selected
          const timeSlotId = timeSlots[categoryId];
          if (timeSlotId) {
            orderData.delivery_time_slot_id = timeSlotId;
            
            // Get time slot details to save on the order for display purposes
            const categorySchedules = await supabase
              .from('delivery_schedules')
              .select('time_slots') as any;
              
            if (!categorySchedules.error && categorySchedules.data?.length > 0) {
              const allTimeSlots = categorySchedules.data.flatMap((s: any) => s.time_slots || []);
              const timeSlot = allTimeSlots.find((slot: any) => slot.id === timeSlotId);
              
              if (timeSlot) {
                orderData.delivery_time_start = timeSlot.start_time;
                orderData.delivery_time_end = timeSlot.end_time;
              }
            }
          }
        } else if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && pickupDetail) {
          orderData.pickup_time = pickupDetail.time;
          orderData.pickup_location = pickupDetail.location;
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();

        if (orderError) throw new Error(`Error creating order: ${orderError.message}`);

        // Add order items
        const orderItems = categoryItems.map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw new Error(`Error adding order items: ${itemsError.message}`);
        
        // Create booking for delivery time slot if applicable
        if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && timeSlots[categoryId]) {
          const bookingData = {
            order_id: order.id,
            time_slot_id: timeSlots[categoryId],
            booking_date: dateString
          };
          
          const { error: bookingError } = await supabase
            .from('delivery_time_bookings')
            .insert(bookingData as any);
            
          if (bookingError) {
            console.error('Failed to create time slot booking:', bookingError);
            // Don't throw here, just log - we already created the order
          }
        }

        orderIds.push(order.id);
      }

      if (orderIds.length === 0) {
        throw new Error('No orders were created');
      }

      // Call the success handler with the first order ID
      onOrderSuccess(orderIds[0]);
    } catch (error) {
      console.error('Order submission error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { submitOrder, isUploading };
}
