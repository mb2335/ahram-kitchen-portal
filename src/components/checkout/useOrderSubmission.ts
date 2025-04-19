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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadPaymentProof } = usePaymentProofUpload();

  const submitOrder = async (props: OrderSubmissionProps, paymentProofFile: File) => {
    try {
      setIsUploading(true);
      setIsSubmitting(true);
      
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
      
      // Get the main fulfillment type date
      const deliveryDate = 
        props.fulfillmentType === 'delivery' 
          ? props.deliveryDates['delivery'] 
          : props.deliveryDates['pickup'];
          
      if (!deliveryDate) {
        throw new Error('Missing delivery or pickup date');
      }
      
      // For delivery orders, we need a time slot
      let deliveryTimeSlot = null;
      if (props.fulfillmentType === 'delivery') {
        const timeSlotSelection = props.timeSlotSelections?.global;
        
        if (timeSlotSelection?.timeSlot) {
          deliveryTimeSlot = timeSlotSelection.timeSlot;
          
          // Verify time slot is still available
          const deliveryDateStr = format(deliveryDate, 'yyyy-MM-dd');
          
          const { data: existingBookings } = await supabase
            .from('delivery_time_bookings')
            .select('id')
            .eq('delivery_date', deliveryDateStr)
            .eq('time_slot', deliveryTimeSlot);
          
          if (existingBookings && existingBookings.length > 0) {
            throw new Error(`The selected delivery time slot is no longer available. Please select another time.`);
          }
        } else {
          // If no time slot selected but delivery is required
          throw new Error(`Please select a delivery time slot for this order.`);
        }
      }
      
      // Calculate total for all items
      const categoryTotal = props.items.reduce((sum, item) => {
        const price = item.price;
        let itemTotal = price * item.quantity;
        
        if (item.discount_percentage) {
          const discountAmount = itemTotal * (item.discount_percentage / 100);
          itemTotal -= discountAmount;
        }
        
        return sum + itemTotal;
      }, 0);
      
      // Create a single order for all items
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          total_amount: props.total,
          tax_amount: props.taxAmount,
          delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
          notes: props.notes,
          payment_proof_url: paymentProofUrl,
          pickup_time: props.pickupDetail?.time,
          pickup_location: props.pickupDetail?.location,
          fulfillment_type: props.fulfillmentType,
          delivery_address: props.customerData.address,
          delivery_time_slot: deliveryTimeSlot,
          status: 'pending'
        })
        .select('id')
        .single();
        
      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      const orderId = orderData.id;
      orderIds.push(orderId);
      
      // Create order items for all items
      const orderItems = props.items.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));
      
      const { error: itemError } = await supabase
        .from('order_items')
        .insert(orderItems);
          
      if (itemError) {
        throw new Error(`Failed to create order items: ${itemError.message}`);
      }
      
      // If this is a delivery order with a selected time slot, book it
      if (props.fulfillmentType === 'delivery' && deliveryTimeSlot) {
        const { error: bookingError } = await supabase
          .from('delivery_time_bookings')
          .insert({
            order_id: orderId,
            category_id: 'global',
            delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
            time_slot: deliveryTimeSlot
          });
          
        if (bookingError) {
          throw new Error(`Failed to book delivery time slot: ${bookingError.message}`);
        }
      }
      
      // Call the success callback with the first order ID
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
      setIsUploading(false);
      setIsSubmitting(false);
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
    isUploading,
    isSubmitting
  };
};
