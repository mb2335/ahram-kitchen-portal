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
  const [fulfillmentType, setFulfillmentType] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [categoryFulfillmentTypes, setCategoryFulfillmentTypes] = useState<Record<string, string>>({});
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

  const itemCategoryIds = items.map(item => item.category_id).filter(Boolean) as string[];
  const categoriesWithItems = new Set(itemCategoryIds);

  useEffect(() => {
    if (!categories.length) return;
    
    const pickupOnlyCategories = new Set<string>();
    let hasDeliveryEligibleItems = false;
    
    Array.from(categoriesWithItems).forEach(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.fulfillment_types) {
        if (category.fulfillment_types.length === 1 && 
            category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
          pickupOnlyCategories.add(categoryId);
        } else if (category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY)) {
          hasDeliveryEligibleItems = true;
        }
      }
    });
    
    if (!fulfillmentType) {
      if (pickupOnlyCategories.size === categoriesWithItems.size) {
        setFulfillmentType(FULFILLMENT_TYPE_PICKUP);
      } else if (hasDeliveryEligibleItems && pickupOnlyCategories.size === 0) {
        setFulfillmentType(FULFILLMENT_TYPE_DELIVERY);
      } else if (pickupOnlyCategories.size > 0) {
        setFulfillmentType(FULFILLMENT_TYPE_PICKUP);
      } else {
        setFulfillmentType(FULFILLMENT_TYPE_PICKUP);
      }
    }
    
    if (Object.keys(categoryFulfillmentTypes).length === 0) {
      const newTypes: Record<string, string> = {};
      
      Array.from(categoriesWithItems).forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        
        if (pickupOnlyCategories.has(categoryId)) {
          newTypes[categoryId] = FULFILLMENT_TYPE_PICKUP;
        } else if (category?.fulfillment_types?.includes(fulfillmentType)) {
          newTypes[categoryId] = fulfillmentType;
        } else if (category?.fulfillment_types?.length) {
          newTypes[categoryId] = category.fulfillment_types[0];
        }
      });
      
      if (Object.keys(newTypes).length > 0) {
        setCategoryFulfillmentTypes(newTypes);
      }
    }

    const updatedDates = { ...formData.deliveryDates };
    let datesWereAdded = false;
    
    Array.from(categoriesWithItems).forEach(categoryId => {
      if (!updatedDates[categoryId]) {
        const category = categories.find(cat => cat.id === categoryId);
        const today = new Date();
        
        if (category) {
          const categoryFulfillmentType = categoryFulfillmentTypes[categoryId] || fulfillmentType;
          
          if (categoryFulfillmentType === FULFILLMENT_TYPE_PICKUP) {
            const dayOfWeek = today.getDay();
            let nextPickupDay = new Date(today);
            
            if (category.pickup_days && category.pickup_days.length > 0) {
              const sortedPickupDays = [...category.pickup_days].sort((a, b) => {
                const daysUntilA = (a - dayOfWeek + 7) % 7;
                const daysUntilB = (b - dayOfWeek + 7) % 7;
                return daysUntilA - daysUntilB;
              });
              
              const nextDay = sortedPickupDays[0];
              const daysToAdd = (nextDay - dayOfWeek + 7) % 7;
              
              nextPickupDay.setDate(today.getDate() + (daysToAdd === 0 ? 0 : daysToAdd));
            }
            
            updatedDates[categoryId] = nextPickupDay;
          } else if (categoryFulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
            const dayOfWeek = today.getDay();
            let deliveryDay = new Date(today);
            
            if (category.pickup_days && category.pickup_days.length > 0) {
              const isPickupDay = category.pickup_days.includes(dayOfWeek);
              
              if (isPickupDay) {
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
          
          console.log(`Setting date for category ${categoryId}:`, updatedDates[categoryId]);
          console.log(`Date type: ${typeof updatedDates[categoryId]}`);
          console.log(`Is Date instance: ${updatedDates[categoryId] instanceof Date}`);
        }
      }
    });
    
    if (datesWereAdded) {
      setFormData(prev => ({
        ...prev,
        deliveryDates: updatedDates
      }));
      
      console.log("All delivery dates after setting defaults:", updatedDates);
      Object.entries(updatedDates).forEach(([catId, dateObj]) => {
        console.log(`Category ${catId} date:`, dateObj);
        if (dateObj instanceof Date) {
          console.log(`  ISO string: ${dateObj.toISOString()}`);
        }
      });
    }
  }, [categories, items, fulfillmentType, categoryFulfillmentTypes, formData.deliveryDates, setFormData]);

  const handleDateChange = (categoryId: string, date: Date) => {
    console.log(`Date change for category ${categoryId}:`, date);
    console.log(`Date type: ${typeof date}`);
    console.log(`Is Date instance: ${date instanceof Date}`);
    
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error(`Invalid date provided for category ${categoryId}`, date);
      toast({
        title: 'Invalid Date',
        description: `Please select a valid date for this category`,
        variant: 'destructive',
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      deliveryDates: {
        ...prev.deliveryDates,
        [categoryId]: date
      }
    }));
    
    setTimeout(() => {
      console.log(`Verified date for category ${categoryId}:`, formData.deliveryDates[categoryId]);
    }, 0);
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
    
    const updatedCategoryTypes = { ...categoryFulfillmentTypes };
    
    Array.from(categoriesWithItems).forEach(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      if (category?.fulfillment_types?.includes(type)) {
        updatedCategoryTypes[categoryId] = type;
      }
    });
    
    setCategoryFulfillmentTypes(updatedCategoryTypes);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const validateDates = (): boolean => {
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean) as string[];
    const uniqueCategoryIds = [...new Set(itemCategoryIds)];
    
    for (const categoryId of uniqueCategoryIds) {
      const hasDate = Object.keys(formData.deliveryDates).some(key => 
        key === categoryId || key.startsWith(categoryId) || categoryId.startsWith(key)
      );
      
      if (!hasDate) {
        const categoryName = categories.find(cat => cat.id === categoryId)?.name || categoryId;
        toast({
          title: 'Missing Date',
          description: `Please select a date for ${categoryName}`,
          variant: 'destructive',
        });
        return false;
      }
      
      const dateKey = Object.keys(formData.deliveryDates).find(key => 
        key === categoryId || key.startsWith(categoryId) || categoryId.startsWith(key)
      );
      
      if (!dateKey) continue;
      
      const date = formData.deliveryDates[dateKey];
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        const categoryName = categories.find(cat => cat.id === categoryId)?.name || categoryId;
        toast({
          title: 'Invalid Date',
          description: `The date for ${categoryName} is invalid. Please try selecting it again.`,
          variant: 'destructive',
        });
        return false;
      }
    }
    
    return true;
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

    if (!validateDates()) {
      return;
    }

    const hasDeliveryItems = Array.from(categoriesWithItems).some(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      
      if (category?.fulfillment_types.length === 1 && 
          category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
        return false;
      }
      
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

    const pickupCategories = Array.from(categoriesWithItems).filter(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
      return categoryFulfillment === FULFILLMENT_TYPE_PICKUP && (category?.has_custom_pickup ?? false);
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
      console.log("Submitting with delivery dates:", formData.deliveryDates);
      
      const itemCategoryIds = items.map(item => item.category_id).filter(Boolean) as string[];
      const uniqueCategoryIds = [...new Set(itemCategoryIds)];
      console.log("Category IDs in cart:", uniqueCategoryIds);
      
      Object.entries(formData.deliveryDates).forEach(([catId, dateObj]) => {
        console.log(`Category ${catId} date type:`, typeof dateObj);
        console.log(`Category ${catId} date value:`, dateObj);
        console.log(`Category ${catId} date constructor:`, dateObj?.constructor?.name);
        
        if (dateObj instanceof Date) {
          console.log(`Category ${catId} valid Date:`, dateObj.toISOString());
        } else if (dateObj && typeof dateObj === 'object') {
          console.log(`Category ${catId} object properties:`, Object.keys(dateObj));
        }
      });
      
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
