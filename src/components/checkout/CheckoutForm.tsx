import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { Upload } from 'lucide-react';
import { useOrderSubmission } from './useOrderSubmission';
import { PickupDetail } from '@/components/vendor/menu/types/category';

interface CheckoutFormProps {
  formData: {
    notes: string;
    deliveryDates: Record<string, Date>;
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
    category_id?: string;
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
  const [pickupDetails, setPickupDetails] = useState<Record<string, PickupDetail>>({});

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

    // Validate that all categories have delivery dates or pickup details
    const categoriesWithItems = new Set(items.map(item => item.category_id).filter(Boolean));
    const missingDeliveryInfo = Array.from(categoriesWithItems).filter(
      categoryId => {
        const hasPickup = pickupDetails[categoryId as string];
        const hasDeliveryDate = formData.deliveryDates[categoryId as string];
        return !hasPickup && !hasDeliveryDate;
      }
    );

    if (missingDeliveryInfo.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select delivery dates or pickup options for all categories',
        variant: 'destructive',
      });
      return;
    }

    await submitOrder({
      items,
      total,
      taxAmount,
      notes: formData.notes,
      deliveryDates: formData.deliveryDates,
      customerData,
      onOrderSuccess,
      pickupDetails
    }, paymentProof);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DeliveryForm
        deliveryDates={formData.deliveryDates}
        notes={formData.notes}
        onDateChange={(categoryId, date) => 
          setFormData({ 
            ...formData, 
            deliveryDates: { 
              ...formData.deliveryDates, 
              [categoryId]: date 
            } 
          })
        }
        onNotesChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        pickupDetails={pickupDetails}
        onPickupDetailChange={(categoryId, detail) => {
          setPickupDetails(prev => ({
            ...prev,
            [categoryId]: detail
          }));
        }}
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