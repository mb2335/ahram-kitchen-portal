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

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
}

interface OrderSubmissionProps {
  items: OrderItem[];
  total: number;
  taxAmount: number;
  notes: string;
  deliveryDate: Date;
  customerData?: CustomerData;
  onOrderSuccess: (orderId: string) => void;
}

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const createGuestCustomer = async (customerData: CustomerData) => {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone || null
      })
      .select('id')
      .single();

    if (customerError) throw customerError;
    return customer.id;
  };

  const getOrCreateCustomer = async (customerData?: CustomerData) => {
    if (!session?.user && !customerData) {
      throw new Error('No customer data provided for guest checkout');
    }

    if (session?.user) {
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

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

      if (insertError) throw insertError;
      return newCustomer.id;
    }

    // Guest checkout
    return createGuestCustomer(customerData!);
  };

  const submitOrder = async ({
    items,
    total,
    taxAmount,
    notes,
    deliveryDate,
    customerData,
    onOrderSuccess
  }: OrderSubmissionProps, paymentProof: File) => {
    setIsUploading(true);

    try {
      // Validate all item IDs are proper UUIDs
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        throw new Error('Invalid menu item IDs detected');
      }

      const customerId = await getOrCreateCustomer(customerData);

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

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      onOrderSuccess(orderData.id);

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order',
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