import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { CustomerForm } from './CustomerForm';
import { Upload } from 'lucide-react';
import { useOrderSubmission } from './useOrderSubmission';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

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
  onOrderSuccess,
  total,
  taxAmount,
  items
}: CheckoutFormProps) {
  const session = useSession();
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const { submitOrder, isUploading } = useOrderSubmission();
  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

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
      customerData: session ? undefined : customerData,
      onOrderSuccess
    }, paymentProof);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!session && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Checkout Options</h2>
            <p className="text-gray-600 mb-4">
              Sign in to save your order history or continue as a guest
            </p>
            <Link to="/auth" state={{ returnTo: '/checkout' }}>
              <Button type="button" variant="outline" className="w-full mb-4">
                Sign in to your account
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  or continue as guest
                </span>
              </div>
            </div>
          </div>
          <CustomerForm
            fullName={customerData.fullName}
            email={customerData.email}
            phone={customerData.phone}
            onFullNameChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
            onEmailChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            onPhoneChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
          />
        </div>
      )}

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