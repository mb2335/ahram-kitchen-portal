
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
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean) as string[];
    const categoriesWithItems = new Set(itemCategoryIds);
    
    // For pickup orders, ensure we have dates for all categories or set default dates
    const isAllPickup = fulfillmentType === FULFILLMENT_TYPE_PICKUP || 
                        Array.from(categoriesWithItems).every(categoryId => 
                          categoryFulfillmentTypes[categoryId] === FULFILLMENT_TYPE_PICKUP);
    
    // If we're in pickup mode and missing dates, set today's date for missing categories
    if (isAllPickup) {
      const today = new Date();
      const updatedDates = { ...formData.deliveryDates };
      let datesWereAdded = false;
      
      Array.from(categoriesWithItems).forEach(categoryId => {
        if (!updatedDates[categoryId]) {
          const category = categories.find(cat => cat.id === categoryId);
          if (category) {
            // Find the next valid pickup day
            const dayOfWeek = today.getDay();
            let nextPickupDay = today;
            
            // If category has pickup days defined, find the next valid one
            if (category.pickup_days && category.pickup_days.length > 0) {
              // Sort pickup days to find the next available one
              const sortedPickupDays = [...category.pickup_days].sort((a, b) => {
                const daysUntilA = (a - dayOfWeek + 7) % 7;
                const daysUntilB = (b - dayOfWeek + 7) % 7;
                return daysUntilA - daysUntilB;
              });
              
              // Get the next pickup day (could be today if it's a pickup day)
              const nextDay = sortedPickupDays[0];
              const daysToAdd = (nextDay - dayOfWeek + 7) % 7;
              
              if (daysToAdd > 0) {
                nextPickupDay = new Date(today);
                nextPickupDay.setDate(today.getDate() + daysToAdd);
              }
            }
            
            updatedDates[categoryId] = nextPickupDay;
            datesWereAdded = true;
          }
        }
      });
      
      if (datesWereAdded) {
        setFormData(prev => ({
          ...prev,
          deliveryDates: updatedDates
        }));
      }
    } else {
      // For delivery or mixed orders, check for missing dates
      const missingDates = Array.from(categoriesWithItems).filter(
        categoryId => {
          const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
          return !formData.deliveryDates[categoryId] && categoryFulfillment !== FULFILLMENT_TYPE_PICKUP;
        }
      );

      if (missingDates.length > 0) {
        toast({
          title: 'Error',
          description: 'Please select dates for all items in your order',
          variant: 'destructive',
        });
        return;
      }
    }

    // Check for pickup requirements only if we have pickup items that need custom pickup details
    const pickupCategories = Array.from(categoriesWithItems).filter(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
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

    // Check for delivery address only if we have delivery items
    const hasDeliveryItems = Array.from(categoriesWithItems).some(categoryId => {
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
      return categoryFulfillment === FULFILLMENT_TYPE_DELIVERY;
    });
    
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

    try {
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
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
    }
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
