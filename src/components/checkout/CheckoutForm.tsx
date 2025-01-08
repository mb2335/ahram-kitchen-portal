import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { Upload } from 'lucide-react';
import { useOrderSubmission } from './useOrderSubmission';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCheckoutForm } from '@/hooks/checkout/useCheckoutForm';
import type { OrderItem } from '@/types/order';

interface CheckoutFormProps {
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
  onOrderSuccess: (orderId: string) => void;
  total: number;
  taxAmount: number;
  items: OrderItem[];
}

export function CheckoutForm({
  customerData,
  onOrderSuccess,
  total,
  taxAmount,
  items
}: CheckoutFormProps) {
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const { submitOrder, isUploading } = useOrderSubmission();
  const { formData, handleDateChange, handleNotesChange, handlePickupDetailChange } = useCheckoutForm();

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CheckoutForm] Starting form submission with data:', formData);
    
    if (!paymentProof) {
      toast({
        title: 'Error',
        description: 'Please upload proof of payment',
        variant: 'destructive',
      });
      return;
    }

    const categoriesWithItems = new Set(items.map(item => item.category_id).filter(Boolean));
    
    const missingDates = Array.from(categoriesWithItems).filter(
      categoryId => !formData.deliveryDates[categoryId as string]
    );

    if (missingDates.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select pickup dates for all categories',
        variant: 'destructive',
      });
      return;
    }

    const missingPickupDetails = Array.from(categoriesWithItems).filter(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      return category?.has_custom_pickup && !formData.pickupDetails[categoryId as string];
    });

    if (missingPickupDetails.length > 0) {
      const categoryNames = missingPickupDetails
        .map(id => categories.find(cat => cat.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      toast({
        title: 'Error',
        description: `Please select pickup time and location for: ${categoryNames}`,
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
      pickupDetails: formData.pickupDetails,
      onOrderSuccess
    }, paymentProof);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DeliveryForm
        deliveryDates={formData.deliveryDates}
        notes={formData.notes}
        onDateChange={handleDateChange}
        onNotesChange={handleNotesChange}
        pickupDetails={formData.pickupDetails}
        onPickupDetailChange={handlePickupDetailChange}
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