
import { supabase } from '@/integrations/supabase/client';
import { OrderItem } from '@/types/order';

interface CreateOrderParams {
  customerId: string;
  categoryId: string;
  deliveryDate: Date;
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  paymentProofUrl: string;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  fulfillmentType?: string;
  deliveryAddress?: string | null;
  deliveryTimeSlot?: string | null;
}

export async function createOrder({
  customerId,
  categoryId,
  deliveryDate,
  items,
  total,
  taxAmount,
  notes,
  paymentProofUrl,
  pickupTime,
  pickupLocation,
  fulfillmentType,
  deliveryAddress,
  deliveryTimeSlot,
}: CreateOrderParams) {
  if (!customerId) {
    console.error("Missing customer ID");
    throw new Error("Customer ID is required");
  }
  
  const categoryItems = items.filter(item => item.category_id === categoryId);
  if (categoryItems.length === 0) return null;

  const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const categoryTaxAmount = categoryTotal * (taxAmount / total);

  console.log("Creating order with data:", {
    customer_id: customerId,
    total_amount: categoryTotal + categoryTaxAmount,
    tax_amount: categoryTaxAmount,
    notes,
    delivery_date: deliveryDate.toISOString(),
    payment_proof_url: paymentProofUrl,
    pickup_time: pickupTime,
    pickup_location: pickupLocation,
    fulfillment_type: fulfillmentType || 'pickup',
    delivery_address: deliveryAddress,
    delivery_time_slot: deliveryTimeSlot
  });

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        customer_id: customerId,
        total_amount: categoryTotal + categoryTaxAmount,
        tax_amount: categoryTaxAmount,
        notes: notes,
        status: 'pending',
        delivery_date: deliveryDate.toISOString(),
        payment_proof_url: paymentProofUrl,
        pickup_time: pickupTime,
        pickup_location: pickupLocation,
        fulfillment_type: fulfillmentType || 'pickup',
        delivery_address: deliveryAddress,
        delivery_time_slot: deliveryTimeSlot
      },
    ])
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError;
  }

  const orderItems = categoryItems.map((item) => ({
    order_id: orderData.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (orderItemsError) {
    console.error("Error creating order items:", orderItemsError);
    throw orderItemsError;
  }

  console.log("Successfully created order:", orderData.id);
  return orderData;
}
