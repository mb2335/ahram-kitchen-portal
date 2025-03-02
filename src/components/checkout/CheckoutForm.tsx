
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
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP, ERROR_MESSAGES } from '@/types/order';
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
  const [fulfillmentType, setFulfillmentType] = useState<string>(FULFILLMENT_TYPE_DELIVERY);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [categoryFulfillmentTypes, setCategoryFulfillmentTypes] = useState<Record<string, string>>({});
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

  const handleFulfillmentTypeChange = (type: string) => {
    setFulfillmentType(type);
  };

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

    // Get categories with items
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    const categoriesWithItems = new Set(itemCategoryIds);
    
    // Check for missing dates
    const missingDates = Array.from(categoriesWithItems).filter(
      categoryId => !formData.deliveryDates[categoryId as string]
    );

    if (missingDates.length > 0) {
      toast({
        title: 'Error',
        description: 'Please select dates for all items in your order',
        variant: 'destructive',
      });
      return;
    }

    // Check for pickup requirements
    const pickupCategories = Array.from(categoriesWithItems).filter(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      const categoryFulfillment = categoryFulfillmentTypes[categoryId as string] || fulfillmentType;
      return categoryFulfillment === FULFILLMENT_TYPE_PICKUP && category?.has_custom_pickup;
    });

    if (pickupCategories.length > 0 && !formData.pickupDetail) {
      const categoryNames = pickupCategories
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

    // Check for delivery address
    const hasDeliveryItems = Object.values(categoryFulfillmentTypes).includes(FULFILLMENT_TYPE_DELIVERY) || 
      (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && Object.keys(categoryFulfillmentTypes).length === 0);
    
    if (hasDeliveryItems && !deliveryAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a delivery address for delivery items',
        variant: 'destructive',
      });
      return;
    }

    // Validate dates against pickup days
    for (const [categoryId, date] of Object.entries(formData.deliveryDates)) {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) continue;
      
      const dayOfWeek = date.getDay();
      const isPickupDay = category.pickup_days?.includes(dayOfWeek);
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
      
      if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
        toast({
          title: 'Invalid Pickup Date',
          description: `Pickup for ${category.name} is only available on designated pickup days.`,
          variant: 'destructive',
        });
        return;
      } else if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
        toast({
          title: 'Invalid Delivery Date',
          description: `Delivery for ${category.name} is not available on pickup days.`,
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
      customerData: {
        ...customerData,
        address: deliveryAddress
      },
      pickupDetail: formData.pickupDetail,
      fulfillmentType,
      categoryFulfillmentTypes,
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
        onFulfillmentTypeChange={handleFulfillmentTypeChange}
        deliveryAddress={deliveryAddress}
        onDeliveryAddressChange={setDeliveryAddress}
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
