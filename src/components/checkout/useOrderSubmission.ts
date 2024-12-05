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
  const [isUploading, setIsUploading] = useState(false);

  const createGuestCustomer = async (customerData: CustomerData) => {
    console.log('Creating guest customer with data:', customerData);
    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          full_name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone || null,
          user_id: null // Explicitly set as null for guest users
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Error creating guest customer:', customerError);
        throw customerError;
      }
      
      console.log('Guest customer created successfully:', customer);
      return customer.id;
    } catch (error) {
      console.error('Caught error while creating guest customer:', error);
      throw error;
    }
  };

  const getOrCreateCustomer = async (customerData?: CustomerData) => {
    console.log('Getting or creating customer. Session:', !!session, 'Customer data:', !!customerData);
    
    if (!session?.user && !customerData) {
      throw new Error('No customer data provided for guest checkout');
    }

    try {
      if (session?.user) {
        console.log('Fetching existing customer for user:', session.user.id);
        const { data: existingCustomer, error: fetchError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching existing customer:', fetchError);
          throw fetchError;
        }

        if (existingCustomer) {
          console.log('Found existing customer:', existingCustomer);
          return existingCustomer.id;
        }

        console.log('Creating new customer for authenticated user');
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
          console.error('Error creating new customer:', insertError);
          throw insertError;
        }
        
        console.log('Created new customer:', newCustomer);
        return newCustomer.id;
      }

      // Guest checkout
      return createGuestCustomer(customerData!);
    } catch (error) {
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
    console.log('Starting order submission process');

    try {
      // Validate all item IDs are proper UUIDs
      const invalidItems = items.filter(item => 
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid menu item IDs:', invalidItems);
        throw new Error('Invalid menu item IDs detected');
      }

      const customerId = await getOrCreateCustomer(customerData);
      console.log('Customer ID obtained:', customerId);

      // Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      console.log('Uploading payment proof:', fileName);
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);

      if (uploadError) {
        console.error('Error uploading payment proof:', uploadError);
        throw uploadError;
      }
      console.log('Payment proof uploaded successfully:', uploadData);

      // Create order
      console.log('Creating order...');
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

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }
      console.log('Order created successfully:', orderData);

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
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

      onOrderSuccess(orderData.id);

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
      throw error; // Re-throw to be handled by the form
    } finally {
      setIsUploading(false);
    }
  };

  return {
    submitOrder,
    isUploading
  };
}