import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { Upload } from 'lucide-react';
import { useOrderSubmission } from './useOrderSubmission';

interface CheckoutFormProps {
  formData: {
    notes: string;
    deliveryDate: Date;
  };
  setFormData: (data: any) => void;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
  onOrderSuccess: (orderId: string) => void;
  total: number;
  taxAmount: number;
  items: Array<{
    id: string;
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
  }>;
}

export function CheckoutForm({
  formData,
  setFormData,
  customerData,
  onOrderSuccess,
  total,
  taxAmount,
  items
}: CheckoutFormProps) {
  const session = useSession();
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const { submitOrder, isUploading } = useOrderSubmission();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      toast({
        title: 'Error',
        description: 'Please upload proof of payment',
        variant: 'destructive',
      });
      return;
    }

    await submitOrder({
      items,
      total,
      taxAmount,
      notes: formData.notes,
      deliveryDate: formData.deliveryDate,
      customerData,
      onOrderSuccess
    }, paymentProof);
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