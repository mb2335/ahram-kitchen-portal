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

  // Fetch categories to attach to items
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

  // Attach category information to items
  const itemsWithCategories = items.map(item => ({
    ...item,
    category: categories.find(cat => cat.id === item.category_id)
  }));

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

    // Validate that all categories have delivery dates and pickup details if required
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

    // Check if pickup details are required and selected
    const missingPickupDetails = Array.from(categoriesWithItems).filter(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      return category?.has_custom_pickup && !selectedPickupDetails[categoryId];
    });

    if (missingPickupDetails.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select pickup locations and times for all categories',
        variant: 'destructive',
      });
      return;
    }

    // Create pickup details object for each category
    const pickupDetailsForOrder = Object.entries(selectedPickupDetails).reduce((acc, [categoryId, pickupDetailIndex]) => {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.pickup_details && category.pickup_details[parseInt(pickupDetailIndex)]) {
        acc[categoryId] = category.pickup_details[parseInt(pickupDetailIndex)];
      }
      return acc;
    }, {} as Record<string, any>);

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
        onPickupDetailChange={(categoryId, pickupDetail) => 
          setSelectedPickupDetails({
            ...selectedPickupDetails,
            [categoryId]: pickupDetail
          })
        }
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