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
import { PickupDetail } from '@/types/pickup';

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
  const [selectedPickupDetails, setSelectedPickupDetails] = useState<Record<string, string>>({});
  const { submitOrder, isUploading } = useOrderSubmission();

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

  const itemsWithCategories = items.map(item => {
    const category = categories.find(cat => cat.id === item.category_id);
    if (!category) return { ...item, category: undefined };
    
    const transformedPickupDetails = category.pickup_details?.map((detail: any) => ({
      time: detail.time as string,
      location: detail.location as string
    })) as PickupDetail[] | undefined;

    return {
      ...item,
      category: {
        id: category.id,
        name: category.name,
        has_custom_pickup: category.has_custom_pickup || false,
        pickup_details: transformedPickupDetails
      }
    };
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
      return category?.has_custom_pickup && !selectedPickupDetails[categoryId as string];
    });

    if (missingPickupDetails.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select pickup locations and times for all categories',
        variant: 'destructive',
      });
      return;
    }

    // Transform selectedPickupDetails indices into actual pickup detail objects
    const pickupDetailsForOrder = Object.entries(selectedPickupDetails).reduce((acc, [categoryId, pickupDetailIndex]) => {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.pickup_details && category.pickup_details[parseInt(pickupDetailIndex)]) {
        const detail = category.pickup_details[parseInt(pickupDetailIndex)] as { time: string; location: string };
        acc[categoryId] = {
          time: detail.time,
          location: detail.location
        };
      }
      return acc;
    }, {} as Record<string, PickupDetail>);

    console.log('Submitting order with pickup details:', pickupDetailsForOrder);

    await submitOrder({
      items: itemsWithCategories,
      total,
      taxAmount,
      notes: formData.notes,
      deliveryDates: formData.deliveryDates,
      customerData,
      onOrderSuccess,
      pickupDetails: pickupDetailsForOrder
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
        selectedPickupDetails={selectedPickupDetails}
        onPickupDetailChange={(categoryId, pickupDetail) => {
          console.log('Pickup detail changed:', { categoryId, pickupDetail });
          setSelectedPickupDetails({
            ...selectedPickupDetails,
            [categoryId]: pickupDetail
          });
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