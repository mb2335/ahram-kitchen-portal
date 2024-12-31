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
}: CreateOrderParams) {
  const categoryItems = items.filter(item => item.category_id === categoryId);
  if (categoryItems.length === 0) return null;

  const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const categoryTaxAmount = categoryTotal * (taxAmount / total);

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
      },
    ])
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = categoryItems.map((item) => ({
    order_id: orderData.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (orderItemsError) throw orderItemsError;

  return orderData;
}