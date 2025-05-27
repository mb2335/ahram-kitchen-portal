import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';
import { OrderSubmissionProps } from '@/types/order';
import { useToast } from '@/hooks/use-toast';
import { usePaymentProofUpload } from '@/hooks/order/usePaymentProofUpload';
import { format } from 'date-fns';
import { updateMenuItemQuantities } from '@/utils/menuItemQuantityManagement';
import { getOrCreateCustomer } from '@/utils/customerManagement';
import { createOrder } from '@/hooks/order/useOrderCreation';

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
      
      console.log("Starting order submission process with data:", { 
        customerData: props.customerData,
        itemCount: props.items.length,
        deliveryDatesAvailable: Object.keys(props.deliveryDates).length,
        fulfillmentType: props.fulfillmentType,
        categoryFulfillmentTypes: props.categoryFulfillmentTypes || {}
      });
      
      // Validate required customer data for checkout
      if (!props.customerData.fullName || !props.customerData.email) {
        throw new Error("Customer name and email are required");
      }

      // Validate SMS opt-in
      if (!props.customerData.smsOptIn) {
        throw new Error("You must agree to receive SMS updates to place an order");
      }
      
      // Upload payment proof
      const paymentProofUrl = await uploadPaymentProof(paymentProofFile);
      console.log("Payment proof uploaded successfully");
      
      // For authenticated users, get or create customer record
      // For guests, this will return null
      const customerId = session?.user?.id ? 
        await getOrCreateCustomer({
          ...props.customerData,
          smsOptIn: true // Ensure this is set to true
        }, session.user.id) : null;
      
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
      
      // Get all category IDs from the items
      const categoryIds = Object.keys(itemsByCategory);
      console.log("Category IDs from items:", categoryIds);
      console.log("Available delivery dates:", props.deliveryDates);
      
      // Calculate fulfillment type dates
      const fulfillmentTypeDates: Record<string, Date> = {};
      
      // First, gather explicit fulfillment type dates
      for (const [key, date] of Object.entries(props.deliveryDates)) {
        if (key === 'pickup' || key === 'delivery') {
          fulfillmentTypeDates[key] = date;
        }
      }
      
      console.log("Fulfillment type dates:", fulfillmentTypeDates);
      
      // Create a map to track which dates to use for each category
      const categoryToDateMap: Record<string, Date> = {};
      
      // First pass - use category-specific dates if available
      for (const categoryId of categoryIds) {
        if (props.deliveryDates[categoryId] &&
            props.deliveryDates[categoryId] instanceof Date &&
            !isNaN(props.deliveryDates[categoryId].getTime())) {
          categoryToDateMap[categoryId] = props.deliveryDates[categoryId];
        }
      }
      
      // Second pass - use fulfillment type dates for categories that don't have specific dates
      for (const categoryId of categoryIds) {
        if (!categoryToDateMap[categoryId]) {
          const categoryFulfillmentType = props.categoryFulfillmentTypes?.[categoryId] || props.fulfillmentType || 'pickup';
          if (fulfillmentTypeDates[categoryFulfillmentType] && 
              fulfillmentTypeDates[categoryFulfillmentType] instanceof Date &&
              !isNaN(fulfillmentTypeDates[categoryFulfillmentType].getTime())) {
            categoryToDateMap[categoryId] = fulfillmentTypeDates[categoryFulfillmentType];
          }
        }
      }
      
      // Third pass - use any valid date as a fallback
      let anyValidDate: Date | null = null;
      
      // Try to find any valid date from explicit category dates or fulfillment type dates
      for (const date of [...Object.values(categoryToDateMap), ...Object.values(fulfillmentTypeDates)]) {
        if (date instanceof Date && !isNaN(date.getTime())) {
          anyValidDate = date;
          break;
        }
      }
      
      // If still no valid date, create one
      if (!anyValidDate) {
        anyValidDate = new Date();
        anyValidDate.setDate(anyValidDate.getDate() + 3);
        console.log("No valid dates found, created default date:", anyValidDate);
      }
      
      // Final pass - ensure all categories have a date
      for (const categoryId of categoryIds) {
        if (!categoryToDateMap[categoryId]) {
          categoryToDateMap[categoryId] = anyValidDate;
          console.log(`Assigning default date for category ${categoryId}:`, anyValidDate);
        }
      }
      
      console.log("Final category date mapping:", categoryToDateMap);
      
      // Generate a single shared order ID for all categories
      const sharedOrderId = crypto.randomUUID();
      console.log("Generated shared order ID for all categories:", sharedOrderId);
      
      const orderIds: string[] = [sharedOrderId]; // All categories will use this same ID
      
      // Create orders for each category using the shared order ID
      for (let i = 0; i < categoryIds.length; i++) {
        const categoryId = categoryIds[i];
        const items = itemsByCategory[categoryId];
        
        console.log(`Processing category ${categoryId} with ${items.length} items`);
        
        // Use the category-specific date from our mapping
        const deliveryDate = categoryToDateMap[categoryId];
        console.log(`Using delivery date for ${categoryId}:`, deliveryDate);
        
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
        
        let orderResult = null;
        try {
          // Calculate total discount amount
          const discountAmount = items.reduce((sum, item) => {
            if (!item.discount_percentage) return sum;
            const itemTotal = item.price * item.quantity;
            return sum + (itemTotal * (item.discount_percentage / 100));
          }, 0);

          orderResult = await createOrder({
            customerId,
            categoryId,
            deliveryDate,
            items,
            total: categoryTotal,
            notes: props.notes,
            paymentProofUrl,
            pickupTime: props.pickupDetail?.time || null,
            pickupLocation: props.pickupDetail?.location || null,
            fulfillmentType: categoryFulfillmentType,
            deliveryAddress: props.customerData.address || null,
            deliveryTimeSlot,
            customerName: props.customerData.fullName,
            customerEmail: props.customerData.email,
            customerPhone: props.customerData.phone || null,
            discountAmount: discountAmount > 0 ? discountAmount : null,
            skipNotification: true, // Skip individual notifications
            sharedOrderId: sharedOrderId, // Use the shared order ID
            isFirstCategory: i === 0 // Mark if this is the first category
          });

          if (orderResult) {
            console.log(`Order processed for category ${categoryId} with shared ID ${sharedOrderId}`);
          }
        } catch (orderError) {
          console.error(`Error creating order for category ${categoryId}:`, orderError);
          throw new Error(`Failed to create order: ${orderError.message}`);
        }

        // Book delivery time slot if necessary
        if (orderResult && categoryFulfillmentType === 'delivery' && deliveryTimeSlot) {
          try {
            const { error: bookingError } = await supabase
              .from('delivery_time_bookings')
              .insert({
                order_id: sharedOrderId, // Use shared order ID for booking
                category_id: categoryId,
                delivery_date: format(deliveryDate, 'yyyy-MM-dd'),
                time_slot: deliveryTimeSlot
              });

            if (bookingError) {
              console.warn(`Failed to book delivery time slot, but continuing:`, bookingError);
            } else {
              console.log(`Booked delivery time slot ${deliveryTimeSlot} for shared order ${sharedOrderId}`);
            }
          } catch (bookingErr) {
            console.warn("Error in delivery time booking, but continuing with order:", bookingErr);
          }
        }
      }
      
      // Send unified notification after all orders are created
      if (orderIds.length > 0) {
        try {
          const { sendUnifiedOrderNotification } = await import('@/hooks/order/useOrderCreation');
          await sendUnifiedOrderNotification(orderIds);
        } catch (notificationError) {
          console.warn("Error sending unified notification, but orders were created:", notificationError);
        }
      }
      
      // Update item quantities
      try {
        await updateMenuItemQuantities(props.items);
        console.log("Menu item quantities updated successfully");
      } catch (qtyError) {
        console.warn("Error updating menu item quantities, but order was created:", qtyError);
      }

      // Determine if user is authenticated before calling success callback
      const isAuthenticated = !!session?.user;
      
      // Call the success callback with the shared order ID
      console.log(`Order submission completed successfully. Calling success callback with shared order ID ${sharedOrderId}`);
      props.onOrderSuccess(sharedOrderId, isAuthenticated);
      
      return sharedOrderId;
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
