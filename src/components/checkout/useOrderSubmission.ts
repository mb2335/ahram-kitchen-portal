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
  customerData: CustomerData;
  onOrderSuccess: (orderId: string) => void;
}

export function useOrderSubmission() {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const getOrCreateCustomer = async (customerData: CustomerData) => {
    try {
      // First, check if a customer with this email already exists
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, user_id')
        .eq('email', customerData.email)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // If customer exists and is associated with a user, but current session is guest
      if (existingCustomer?.user_id && !session?.user) {
        throw new Error('This email is associated with an account. Please sign in.');
      }

      // If customer exists, return their ID
      if (existingCustomer) {
        return existingCustomer.id;
      }

      // If no existing customer, create a new one
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          full_name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone,
          user_id: session?.user?.id || null
        })
        .select()
        .single();

      if (createError) throw createError;
      return newCustomer.id;
    } catch (error: any) {
      console.error('Error in getOrCreateCustomer:', error);
      throw error;
    }
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

      // Get or create customer
      const customerId = await getOrCreateCustomer(customerData);

      // Upload payment proof with unique filename
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof, {
          cacheControl: '3600',
          upsert: false
        });

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