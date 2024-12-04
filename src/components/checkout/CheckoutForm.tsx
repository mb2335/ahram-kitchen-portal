import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CustomerForm } from './CustomerForm';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';

interface CheckoutFormProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    notes: string;
    deliveryDate: Date;
  };
  setFormData: (data: any) => void;
  onOrderSuccess: (orderId: string) => void;
  total: number;
  taxAmount: number;
  items: any[];
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) {
      toast({
        title: 'Error',
        description: 'Please sign in to complete your order',
        variant: 'destructive',
      });
      navigate('/auth', { state: { returnTo: '/checkout' } });
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
      // Get customer ID
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (customerError) throw customerError;

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
            customer_id: customerData.id,
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

      // Trigger email notification (handled by database trigger)
      onOrderSuccess(orderData.id);
    } catch (error: any) {
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Order Details</h2>
      
      <CustomerForm
        fullName={formData.fullName}
        email={formData.email}
        phone={formData.phone}
        onFullNameChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        onEmailChange={(e) => setFormData({ ...formData, email: e.target.value })}
        onPhoneChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        isReadOnly={!!session}
      />

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