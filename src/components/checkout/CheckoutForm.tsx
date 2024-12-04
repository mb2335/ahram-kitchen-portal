import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutFormProps {
  formData: {
    notes: string;
    deliveryDate: Date;
  };
  setFormData: (data: any) => void;
  onOrderSuccess: (orderId: string) => void;
  total: number;
  taxAmount: number;
  items: Array<{
    id: string; // Ensure this is a UUID string
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
  }>;
}

export function CheckoutForm({
  formData,
  setFormData,
  onOrderSuccess,
  total,
  taxAmount,
  items
}: CheckoutFormProps) {
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const getOrCreateCustomer = async () => {
    if (!session?.user) {
      throw new Error('No session found');
    }

    // First, try to get existing customer
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

    // If no customer exists, create one
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) {
      toast({
        title: 'Error',
        description: 'Please sign in to complete your order',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentProof) {
      toast({
        title: 'Error',
        description: 'Please upload proof of payment',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const customerId = await getOrCreateCustomer();

      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: customerId,
            total_amount: total + taxAmount,
            tax_amount: taxAmount,
            notes: formData.notes,
            status: 'pending',
            delivery_date: formData.deliveryDate.toISOString(),
            payment_proof_url: uploadData.path,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with proper UUID handling
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        menu_item_id: item.id, // Now properly passing UUID string
        quantity: item.quantity,
        unit_price: item.price,
      }));

      console.log('Creating order items:', orderItems); // Debug log

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      onOrderSuccess(orderData.id);
      
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DeliveryForm
        deliveryDate={formData.deliveryDate}
        notes={formData.notes}
        onDateChange={(date) => date && setFormData({ ...formData, deliveryDate: date })}
        onNotesChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <PaymentInstructions
        paymentProof={paymentProof}
        onFileChange={handleFileChange}
      />

      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Place Order'
        )}
      </Button>
    </form>
  );
}