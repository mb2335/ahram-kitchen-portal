import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  nameKo: string;
  quantity: number;
  price: number;
}

interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDate: Date;
  onOrderSuccess: (orderId: string) => void;
}

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const getOrCreateCustomer = async () => {
    if (!session?.user) {
      throw new Error('No session found');
    }

    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching customer:', fetchError);
      throw fetchError;
    }

    if (existingCustomer) {
      return existingCustomer.id;
    }

    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        user_id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || 'Unknown',
        phone: session.user.user_metadata?.phone || null
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      throw insertError;
    }

    return newCustomer.id;
  };

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDate,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    if (!session?.user.id) {
      toast({
        title: 'Error',
        description: 'Please sign in to complete your order',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const customerId = await getOrCreateCustomer();

      // Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: customerId,
            total_amount: total + taxAmount,
            tax_amount: taxAmount,
            notes: notes,
            status: 'pending',
            delivery_date: deliveryDate.toISOString(),
            payment_proof_url: uploadData.path,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with proper UUID handling
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id, // This should now be a proper UUID from the menu items table
        quantity: item.quantity,
        unit_price: item.price,
      }));

      console.log('Creating order items:', orderItems);

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      onOrderSuccess(orderData.id);
      
      // Navigate to thank you page with order details
      navigate('/thank-you', {
        state: {
          orderDetails: {
            id: orderData.id,
            items: items.map(item => ({
              name: item.name,
              nameKo: item.nameKo,
              quantity: item.quantity,
              price: item.price
            })),
            total: total + taxAmount,
            taxAmount: taxAmount,
            createdAt: orderData.created_at
          }
        },
        replace: true
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}