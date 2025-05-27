
import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '@/types/order';

interface CreateOrderParams {
  customerId?: string | null;
  categoryId: string;
  deliveryDate: Date;
  items: OrderItem[];
  total: number;
  notes: string;
  paymentProofUrl: string;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  fulfillmentType?: string;
  deliveryAddress?: string | null;
  deliveryTimeSlot?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  discountAmount?: number | null;
  skipNotification?: boolean;
  sharedOrderId?: string; // Use shared order ID for grouping
  isFirstCategory?: boolean; // Track if this is the first category
}

export async function createOrder({
  customerId,
  categoryId,
  deliveryDate,
  items,
  total,
  notes,
  paymentProofUrl,
  pickupTime,
  pickupLocation,
  fulfillmentType,
  deliveryAddress,
  deliveryTimeSlot,
  customerName,
  customerEmail,
  customerPhone,
  discountAmount,
  skipNotification = false,
  sharedOrderId,
  isFirstCategory = false
}: CreateOrderParams) {
  const categoryItems = items.filter(item => item.category_id === categoryId);
  if (categoryItems.length === 0) return null;

  // Calculate the actual total with discounts applied
  const categoryTotal = categoryItems.reduce((sum, item) => {
    const price = item.discount_percentage 
      ? item.price * (1 - item.discount_percentage / 100) 
      : item.price;
    return sum + price * item.quantity;
  }, 0);

  // Use the provided discount amount or recalculate if not provided
  const finalDiscountAmount = discountAmount !== undefined ? discountAmount : categoryItems.reduce((sum, item) => {
    if (!item.discount_percentage) return sum;
    const originalPrice = item.price * item.quantity;
    const discountedPrice = item.price * (1 - item.discount_percentage / 100) * item.quantity;
    return sum + (originalPrice - discountedPrice);
  }, 0);

  const orderData = {
    customer_id: customerId,
    total_amount: categoryTotal,
    notes,
    delivery_date: deliveryDate.toISOString(),
    payment_proof_url: paymentProofUrl,
    pickup_time: pickupTime,
    pickup_location: pickupLocation,
    fulfillment_type: fulfillmentType || 'pickup',
    delivery_address: deliveryAddress,
    delivery_time_slot: deliveryTimeSlot,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    discount_amount: finalDiscountAmount > 0 ? finalDiscountAmount : null
  };

  console.log("Creating order with data:", orderData);

  try {
    let finalOrderData;
    
    if (sharedOrderId && isFirstCategory) {
      // For the first category, create the main order with the shared ID
      finalOrderData = {
        id: sharedOrderId,
        ...orderData,
        status: 'pending'
      };
      
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert(finalOrderData)
        .select()
        .single();

      if (orderError) {
        console.error("Error creating main order:", orderError);
        throw orderError;
      }
      
      finalOrderData = insertedOrder;
    } else if (sharedOrderId && !isFirstCategory) {
      // For subsequent categories, update the existing order by adding amounts
      const { data: existingOrder, error: fetchError } = await supabase
        .from('orders')
        .select('total_amount, discount_amount')
        .eq('id', sharedOrderId)
        .single();

      if (fetchError) {
        console.error("Error fetching existing order:", fetchError);
        throw fetchError;
      }

      const updatedTotalAmount = existingOrder.total_amount + categoryTotal;
      const updatedDiscountAmount = (existingOrder.discount_amount || 0) + (finalDiscountAmount || 0);

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: updatedTotalAmount,
          discount_amount: updatedDiscountAmount > 0 ? updatedDiscountAmount : null
        })
        .eq('id', sharedOrderId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating order totals:", updateError);
        throw updateError;
      }

      finalOrderData = updatedOrder;
    } else {
      // Create new order with auto-generated ID (fallback)
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }
      
      finalOrderData = insertedOrder;
    }

    console.log("Successfully created/updated order record:", finalOrderData);

    // Create the order items - always use the shared order ID if provided
    const orderItems = categoryItems.map((item) => ({
      order_id: sharedOrderId || finalOrderData.id,
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

    console.log("Successfully created order items:", orderItems.length);

    // Only send notification if not skipped (for individual orders, we'll skip and send unified notification later)
    if (!skipNotification) {
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
        .eq('id', sharedOrderId || finalOrderData.id)
        .single();

      if (!fetchError && completeOrder) {
        try {
          await supabase.functions.invoke('send-sms', {
            body: {
              type: 'order_status_update',
              order: completeOrder,
              previousStatus: null
            }
          });
          console.log("Order creation notification sent");
        } catch (notificationError) {
          console.error("Error sending order creation notification:", notificationError);
        }
      }
    }

    return finalOrderData;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
}

// New function to send unified order notification
export async function sendUnifiedOrderNotification(orderIds: string[]) {
  try {
    if (orderIds.length === 0) return;
    
    // Get all orders with their items
    const { data: orders, error } = await supabase
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
      .in('id', orderIds);

    if (error || !orders || orders.length === 0) {
      console.error("Error fetching orders for unified notification:", error);
      return;
    }

    // Send unified notification with all orders
    await supabase.functions.invoke('send-sms', {
      body: {
        type: 'unified_order_notification',
        orders: orders,
        customerPhone: orders[0].customer_phone,
        customerName: orders[0].customer_name
      }
    });
    
    console.log("Unified order notification sent for orders:", orderIds);
  } catch (error) {
    console.error("Error sending unified order notification:", error);
  }
}
