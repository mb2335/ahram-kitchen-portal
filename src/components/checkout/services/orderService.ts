import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
}

interface OrderData {
  customerId: string;
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDate: Date;
  paymentProofPath: string;
}

export async function createOrder(orderData: OrderData) {
  console.log('Creating order with data:', orderData);
  try {
    const { data: orderData: createdOrder, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id: orderData.customerId,
          total_amount: orderData.total + orderData.taxAmount,
          tax_amount: orderData.taxAmount,
          notes: orderData.notes,
          status: 'pending',
          delivery_date: orderData.deliveryDate.toISOString(),
          payment_proof_url: orderData.paymentProofPath,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }
    console.log('Order created successfully:', createdOrder);

    // Create order items
    const orderItems = orderData.items.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    console.log('Creating order items:', orderItems);
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      throw orderItemsError;
    }
    console.log('Order items created successfully');

    return createdOrder.id;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}

export async function uploadPaymentProof(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  console.log('Uploading payment proof:', fileName);
  
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('payment_proofs')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading payment proof:', uploadError);
    throw uploadError;
  }
  console.log('Payment proof uploaded successfully:', uploadData);
  
  return uploadData.path;
}