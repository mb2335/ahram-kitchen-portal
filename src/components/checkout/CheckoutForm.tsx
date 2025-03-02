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
    
    // Set default dates for all categories if not already set
    const updatedDates = { ...formData.deliveryDates };
    let datesWereAdded = false;
    
    // For both delivery and pickup, ensure all categories have dates
    Array.from(categoriesWithItems).forEach(categoryId => {
      if (!updatedDates[categoryId]) {
        const category = categories.find(cat => cat.id === categoryId);
        const today = new Date();
        
        if (category) {
          // For pickup: find the next valid pickup day
          if (fulfillmentType === FULFILLMENT_TYPE_PICKUP || 
              categoryFulfillmentTypes[categoryId] === FULFILLMENT_TYPE_PICKUP) {
              
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
          } 
          // For delivery: set a default date on a non-pickup day
          else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY || 
                   categoryFulfillmentTypes[categoryId] === FULFILLMENT_TYPE_DELIVERY) {
            
            const dayOfWeek = today.getDay();
            let deliveryDay = today;
            
            // If category has pickup days defined, find a non-pickup day
            if (category.pickup_days && category.pickup_days.length > 0) {
              // Check if today is a pickup day
              const isPickupDay = category.pickup_days.includes(dayOfWeek);
              
              if (isPickupDay) {
                // Find the next non-pickup day
                for (let i = 1; i <= 7; i++) {
                  const nextDate = new Date(today);
                  nextDate.setDate(today.getDate() + i);
                  const nextDayOfWeek = nextDate.getDay();
                  
                  if (!category.pickup_days.includes(nextDayOfWeek)) {
                    deliveryDay = nextDate;
                    break;
                  }
                }
              }
            }
            
            updatedDates[categoryId] = deliveryDay;
          }
          
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

    try {
      await submitOrder({
        items,
        total,
        taxAmount,
        notes: formData.notes,
        deliveryDates: updatedDates, // Use the updated dates which include default dates
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
