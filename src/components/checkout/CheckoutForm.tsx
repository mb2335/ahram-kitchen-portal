
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
import type { OrderItem } from '@/types/order';
import { PickupDetail } from '@/types/pickup';

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
  formData: {
    notes: string;
    deliveryDates: Record<string, Date>;
    pickupDetail: PickupDetail | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    notes: string;
    deliveryDates: Record<string, Date>;
    pickupDetail: PickupDetail | null;
  }>>;
}

export function CheckoutForm({
  customerData,
  onOrderSuccess,
  total,
  taxAmount,
  items,
  formData,
  setFormData
}: CheckoutFormProps) {
  const { toast } = useToast();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<string>('delivery');
  const { submitOrder, isUploading } = useOrderSubmission();

  const handleDateChange = (categoryId: string, date: Date) => {
    setFormData(prev => ({
      ...prev,
      deliveryDates: {
        ...prev.deliveryDates,
        [categoryId]: date
      }
    }));
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };

  const handlePickupDetailChange = (detail: PickupDetail) => {
    setFormData(prev => ({
      ...prev,
      pickupDetail: detail
    }));
  };

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

    if (fulfillmentType === 'delivery' && missingDates.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select delivery dates for all categories',
        variant: 'destructive',
      });
      return;
    }

    if (fulfillmentType === 'pickup') {
      const missingPickupDetails = Array.from(categoriesWithItems).filter(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        return category?.has_custom_pickup && !formData.pickupDetail;
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
    }

    await submitOrder({
      items,
      total,
      taxAmount,
      notes: formData.notes,
      deliveryDates: formData.deliveryDates,
      customerData,
      pickupDetail: formData.pickupDetail,
      fulfillmentType,
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
        pickupDetail={formData.pickupDetail}
        onPickupDetailChange={handlePickupDetailChange}
        fulfillmentType={fulfillmentType}
        onFulfillmentTypeChange={setFulfillmentType}
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
