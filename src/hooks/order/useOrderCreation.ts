
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
  discountAmount
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

  console.log("Creating order with data:", {
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
  });

  try {
    // Create the order record
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        total_amount: categoryTotal,
        tax_amount: 0, // Set tax amount to 0
        notes: notes,
        status: 'pending',
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
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    console.log("Successfully created order record:", orderData);

    // Create the order items
    const orderItems = categoryItems.map((item) => ({
      order_id: orderData.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      discount_percentage: item.discount_percentage || null // Store the discount percentage with each order item
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error("Error creating order items:", orderItemsError);
      throw orderItemsError;
    }

    console.log("Successfully created order items:", orderItems.length);

    // Get the complete order with items to send notification
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
      .eq('id', orderData.id)
      .single();

    if (!fetchError && completeOrder) {
      // Send new order notification via SMS
      try {
        await supabase.functions.invoke('send-sms', {
          body: {
            type: 'order_status_update',
            order: completeOrder,
            previousStatus: null // null indicates a new order
          }
        });
        console.log("Order creation notification sent");
      } catch (notificationError) {
        console.error("Error sending order creation notification:", notificationError);
        // Continue with the order creation even if notification fails
      }
    }

    return orderData;
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
}
