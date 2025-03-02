
import { useState, useEffect } from 'react';
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

  // Fetch all categories to get pickup days and other details
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

  // Get categories with items
  const itemCategoryIds = items.map(item => item.category_id).filter(Boolean) as string[];
  const categoriesWithItems = new Set(itemCategoryIds);

  // Effect to set initial fulfillment types and default dates
  useEffect(() => {
    if (!categories.length) return;
    
    // Initialize default category fulfillment types if empty
    if (Object.keys(categoryFulfillmentTypes).length === 0) {
      const newCategoryFulfillmentTypes: Record<string, string> = {};
      
      Array.from(categoriesWithItems).forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        if (category?.fulfillment_types?.length) {
          // Default to delivery if available, otherwise pickup
          newCategoryFulfillmentTypes[categoryId] = 
            category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) 
              ? FULFILLMENT_TYPE_DELIVERY 
              : FULFILLMENT_TYPE_PICKUP;
        }
      });
      
      if (Object.keys(newCategoryFulfillmentTypes).length > 0) {
        setCategoryFulfillmentTypes(newCategoryFulfillmentTypes);
      }
    }

    // Set default dates for categories
    const updatedDates = { ...formData.deliveryDates };
    let datesWereAdded = false;
    
    Array.from(categoriesWithItems).forEach(categoryId => {
      if (!updatedDates[categoryId]) {
        const category = categories.find(cat => cat.id === categoryId);
        const today = new Date();
        
        if (category) {
          const categoryFulfillmentType = categoryFulfillmentTypes[categoryId] || fulfillmentType;
          
          // For pickup: find the next valid pickup day
          if (categoryFulfillmentType === FULFILLMENT_TYPE_PICKUP) {
            const dayOfWeek = today.getDay();
            let nextPickupDay = new Date(today);
            
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
              
              nextPickupDay.setDate(today.getDate() + (daysToAdd === 0 ? 0 : daysToAdd));
            }
            
            updatedDates[categoryId] = nextPickupDay;
          } 
          // For delivery: set a default date on a non-pickup day
          else if (categoryFulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
            const dayOfWeek = today.getDay();
            let deliveryDay = new Date(today);
            
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
  }, [categories, items, fulfillmentType, categoryFulfillmentTypes, formData.deliveryDates, setFormData]);

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

    // Ensure we have dates for all categories
    const missingDates = Array.from(categoriesWithItems).filter(categoryId => 
      !formData.deliveryDates[categoryId]
    );
    
    if (missingDates.length > 0) {
      const categoryNames = missingDates
        .map(id => categories.find(cat => cat.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      toast({
        title: 'Error',
        description: `Please select dates for: ${categoryNames}`,
        variant: 'destructive',
      });
      return;
    }

    // Check for pickup requirements
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

    // Check for delivery address
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
    const dateErrors: string[] = [];
    Array.from(categoriesWithItems).forEach(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category || !category.pickup_days) return;
      
      const date = formData.deliveryDates[categoryId];
      if (!date) return;
      
      const dayOfWeek = date.getDay();
      const isPickupDay = category.pickup_days.includes(dayOfWeek);
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
      
      if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
        dateErrors.push(`${category.name}: Pickup is only available on designated pickup days`);
      } else if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
        dateErrors.push(`${category.name}: Delivery is not available on pickup days`);
      }
    });
    
    if (dateErrors.length > 0) {
      toast({
        title: 'Date Selection Error',
        description: dateErrors.join('\n'),
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
        categoryFulfillmentTypes={categoryFulfillmentTypes}
        onCategoryFulfillmentTypeChange={(categoryId, type) => {
          setCategoryFulfillmentTypes(prev => ({
            ...prev,
            [categoryId]: type
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
