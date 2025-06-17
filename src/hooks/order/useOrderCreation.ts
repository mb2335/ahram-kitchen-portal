
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
  orderId?: string; // Add parameter to use existing order ID
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
  orderId // Use provided order ID if available
}: CreateOrderParams) {
  const categoryItems = items.filter(item => item.category_id === categoryId);
  if (categoryItems.length === 0) return null;

  console.log(`Creating order for category ${categoryId} with ${categoryItems.length} items:`, 
    categoryItems.map(item => ({ name: item.name, category_id: item.category_id })));

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
    
    if (orderId) {
      // For subsequent categories, create a new UUID since we can't use the same ID
      const newOrderId = crypto.randomUUID();
      finalOrderData = {
        id: newOrderId,
        ...orderData
      };
      
      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...finalOrderData,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order with new ID:", orderError);
        throw orderError;
      }
      
      finalOrderData = insertedOrder;
    } else {
      // Create new order with auto-generated ID - this is for the first category
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

    console.log("Successfully created order record:", finalOrderData);

    // Create the order items - PRESERVE CATEGORY DATA
    const orderItems = categoryItems.map((item) => {
      const orderItem = {
        order_id: finalOrderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percentage: item.discount_percentage || null
      };
      
      console.log(`Creating order item for menu_item_id: ${item.id} (category: ${item.category_id})`);
      return orderItem;
    });

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
        .eq('id', finalOrderData.id)
        .single();

      if (!fetchError && completeOrder) {
        try {
          console.log("Sending notification for order with category data:", completeOrder);
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
    
    // Get all orders with their items INCLUDING CATEGORY DATA
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
      .in('id', orderIds);

    if (error || !orders || orders.length === 0) {
      console.error("Error fetching orders for unified notification:", error);
      return;
    }

    console.log("Sending unified notification for orders with category data:", orders);

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
