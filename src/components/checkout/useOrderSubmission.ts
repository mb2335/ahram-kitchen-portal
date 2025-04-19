
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { OrderSubmissionProps } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { usePaymentProofUpload } from '@/hooks/order/usePaymentProofUpload';
import { format } from 'date-fns';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';
import { getOrCreateCustomer } from '@/utils/customerManagement';

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
      
      console.log("Starting order submission process with data:", { 
        customerData: props.customerData,
        itemCount: props.items.length,
        deliveryDatesAvailable: Object.keys(props.deliveryDates).length
      });
      
      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(paymentProofFile);
      console.log("Payment proof uploaded successfully");
      
      // Get customer ID - use customer management utility for better code organization
      const customerId = await getOrCreateCustomer(props.customerData, session?.user?.id);
      console.log("Customer ID obtained:", customerId);
      
      // Group items by category
      const itemsByCategory = props.items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(item);
        return acc;
      }, {} as Record<string, typeof props.items>);
      
      console.log(`Items grouped by ${Object.keys(itemsByCategory).length} categories`);
      
      const categoryIds = Object.keys(itemsByCategory);
      const orderIds: string[] = [];
      
      // Create one order per category
      for (const categoryId of categoryIds) {
        const items = itemsByCategory[categoryId];
        
        console.log(`Processing category ${categoryId} with ${items.length} items`);
        
        // Handle delivery date - ultra defensive with multiple fallbacks
        let deliveryDate: Date;
        
        // First try - get category specific date
        if (props.deliveryDates[categoryId] && props.deliveryDates[categoryId] instanceof Date) {
          deliveryDate = props.deliveryDates[categoryId];
          console.log(`Using category-specific date for ${categoryId}:`, deliveryDate);
        }
        // Second try - use any available date
        else if (Object.values(props.deliveryDates).length > 0) {
          const firstAvailableDate = Object.values(props.deliveryDates).find(date => date instanceof Date);
          if (firstAvailableDate) {
            deliveryDate = firstAvailableDate;
            console.log(`Using fallback date for ${categoryId} from other categories:`, deliveryDate);
          }
          // Third try - create a new date
          else {
            deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 3); // Default to 3 days from now
            console.log(`Created emergency date for ${categoryId}:`, deliveryDate);
          }
        }
        // Last fallback - just use a date 3 days from now
        else {
          deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3);
          console.log(`No dates available, using default date for ${categoryId}:`, deliveryDate);
        }
        
        // Ensure we have a valid date format
        if (!(deliveryDate instanceof Date) || isNaN(deliveryDate.getTime())) {
          console.log(`Invalid date detected for ${categoryId}, creating new one`);
          deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3);
        }
        
        // Determine fulfillment type for this category
        const categoryFulfillmentType = props.categoryFulfillmentTypes?.[categoryId] || props.fulfillmentType || 'pickup';
        console.log(`Using fulfillment type for ${categoryId}:`, categoryFulfillmentType);
        
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
        
        // Get delivery time slot if applicable
        let deliveryTimeSlot = null;
        if (categoryFulfillmentType === 'delivery') {
          // Try global time slot first, then category-specific
          const timeSlotSelection = props.timeSlotSelections?.global || props.timeSlotSelections?.[categoryId];
          
          if (timeSlotSelection?.timeSlot) {
            deliveryTimeSlot = timeSlotSelection.timeSlot;
            console.log(`Using time slot for ${categoryId}:`, deliveryTimeSlot);
          } else {
            console.log(`No time slot selected for delivery in category ${categoryId}, but proceeding anyway`);
          }
        }
        
        // Prepare order data with all necessary details
        const orderData = {
          customer_id: customerId,
          total_amount: totalAmount,
          tax_amount: categoryTaxAmount,
          delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
          notes: props.notes,
          payment_proof_url: paymentProofUrl,
          pickup_time: props.pickupDetail?.time || null,
          pickup_location: props.pickupDetail?.location || null,
          fulfillment_type: categoryFulfillmentType,
          delivery_address: props.customerData.address || null,
          delivery_time_slot: deliveryTimeSlot,
          status: 'pending'
        };
        
        console.log(`Creating order for category ${categoryId} with data:`, orderData);
        
        // Create the order
        const { data: createdOrder, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();
          
        if (orderError) {
          console.error(`Error creating order for category ${categoryId}:`, orderError);
          throw new Error(`Failed to create order: ${orderError.message}`);
        }
        
        const orderId = createdOrder.id;
        orderIds.push(orderId);
        console.log(`Order created with ID ${orderId}`);
        
        // Create order items
        const orderItems = items.map(item => ({
          order_id: orderId,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
            
        if (itemsError) {
          console.error(`Error creating order items for order ${orderId}:`, itemsError);
          throw new Error(`Failed to create order items: ${itemsError.message}`);
        }
        
        console.log(`Created ${items.length} order items for order ${orderId}`);
        
        // If this is a delivery order with a selected time slot, book it
        if (categoryFulfillmentType === 'delivery' && deliveryTimeSlot) {
          try {
            const { error: bookingError } = await supabase
              .from('delivery_time_bookings')
              .insert({
                order_id: orderId,
                category_id: categoryId,
                delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
                time_slot: deliveryTimeSlot
              });
              
            if (bookingError) {
              console.warn(`Failed to book delivery time slot, but continuing:`, bookingError);
            } else {
              console.log(`Booked delivery time slot ${deliveryTimeSlot} for order ${orderId}`);
            }
          } catch (bookingErr) {
            console.warn("Error in delivery time booking, but continuing with order:", bookingErr);
          }
        }
      }
      
      // Update item quantities
      try {
        await updateMenuItemQuantities(props.items);
        console.log("Menu item quantities updated successfully");
      } catch (qtyError) {
        console.warn("Error updating menu item quantities, but order was created:", qtyError);
      }
      
      // Call the success callback with the first order ID
      console.log(`Order submission completed successfully. Calling success callback with order ID ${orderIds[0]}`);
      props.onOrderSuccess(orderIds[0]);
      
      return orderIds[0];
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
      .maybeSingle();
      
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
