import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
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
      // First, try to find an existing customer with this email
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', customerData.email)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // If we found an existing customer
      if (existingCustomer) {
        // If the customer is associated with a user and we're not that user
        if (existingCustomer.user_id && session?.user?.id !== existingCustomer.user_id) {
          throw new Error('This email is associated with an existing account. Please sign in.');
        }
        
        // Update the existing customer's information
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            full_name: customerData.fullName,
            phone: customerData.phone,
            // Only update user_id if we have a session and the customer doesn't already have one
            ...(session?.user?.id && !existingCustomer.user_id ? { user_id: session.user.id } : {})
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updatedCustomer.id;
      }

      // If no existing customer found, create a new one
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