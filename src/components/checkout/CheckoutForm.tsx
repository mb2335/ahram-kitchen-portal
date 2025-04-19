
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { Upload, Loader2 } from 'lucide-react';
import { useOrderSubmission } from './useOrderSubmission';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP, OrderItem } from '@/types/order';
import { PickupDetail } from '@/types/pickup';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCheckoutForm } from '@/hooks/checkout/useCheckoutForm';
import { DeliveryTimeSlotSelection } from '@/types/delivery';

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
  const { t } = useLanguage();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<string>('');
  const [categoryFulfillmentTypes, setCategoryFulfillmentTypes] = useState<Record<string, string>>({});
  const { submitOrder, isUploading, isSubmitting } = useOrderSubmission();
  
  const { 
    formData, 
    handleDateChange, 
    handleNotesChange, 
    handlePickupDetailChange,
    handleDeliveryAddressChange,
    handleTimeSlotSelectionChange
  } = useCheckoutForm();

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
  }, [categories, items, fulfillmentType, categoryFulfillmentTypes]);

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

  const handleCategoryFulfillmentTypeChange = (categoryId: string, type: string) => {
    setCategoryFulfillmentTypes(prev => ({
      ...prev,
      [categoryId]: type
    }));
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
      const hasDate = formData.deliveryDates[categoryId] !== undefined;
      
      if (!hasDate) {
        const categoryName = categories.find(cat => cat.id === categoryId)?.name || categoryId;
        toast({
          title: t('checkout.error.date'),
          description: `Please select a date for ${categoryName}`,
          variant: 'destructive',
        });
        return false;
      }
      
      const date = formData.deliveryDates[categoryId];
      
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        const categoryName = categories.find(cat => cat.id === categoryId)?.name || categoryId;
        toast({
          title: t('checkout.error.date'),
          description: `The date for ${categoryName} is invalid. Please try selecting it again.`,
          variant: 'destructive',
        });
        return false;
      }
    }
    
    return true;
  };

  const validateTimeSlots = (): boolean => {
    const deliveryCategories = Object.entries(categoryFulfillmentTypes)
      .filter(([_, type]) => type === FULFILLMENT_TYPE_DELIVERY)
      .map(([id]) => id);
    
    // If we have delivery categories but no global time slot
    if (deliveryCategories.length > 0 && 
        (!formData.deliveryTimeSlotSelections?.global || 
         !formData.deliveryTimeSlotSelections.global.timeSlot)) {
      toast({
        title: t('checkout.error.time'),
        description: "Please select a delivery time slot",
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const { data: pickupSettings = [] } = useQuery({
    queryKey: ['pickup-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .order('day');
      
      if (error) throw error;
      return data;
    },
  });

  const pickupDaysByDay = pickupSettings.reduce((acc, setting) => {
    if (!acc[setting.day]) {
      acc[setting.day] = [];
    }
    acc[setting.day].push(setting);
    return acc;
  }, {} as Record<number, any[]>);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof) {
      toast({
        title: t('checkout.error.payment'),
        description: t('checkout.error.payment'),
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
    
    if (hasDeliveryItems) {
      if (!formData.deliveryAddress?.trim()) {
        toast({
          title: t('checkout.error.address'),
          description: t('checkout.error.address'),
          variant: 'destructive',
        });
        return;
      }
      
      if (!validateTimeSlots()) {
        return;
      }
    }

    const dateErrors: string[] = [];
    Array.from(categoriesWithItems).forEach(categoryId => {
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;
      
      const date = formData.deliveryDates[categoryId];
      if (!date) return;
      
      const dayOfWeek = date.getDay();
      const hasPickupDay = pickupDaysByDay[dayOfWeek]?.length > 0;
      const categoryFulfillment = categoryFulfillmentTypes[categoryId] || fulfillmentType;
      
      if (categoryFulfillment === FULFILLMENT_TYPE_PICKUP && !hasPickupDay) {
        dateErrors.push(`${category.name}: Pickup is only available on designated pickup days`);
      } else if (categoryFulfillment === FULFILLMENT_TYPE_DELIVERY && hasPickupDay) {
        dateErrors.push(`${category.name}: Delivery is not available on pickup days`);
      }
    });
    
    if (dateErrors.length > 0) {
      toast({
        title: t('checkout.error.date'),
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
          address: formData.deliveryAddress
        },
        pickupDetail: Object.values(formData.pickupDetails)[0] || null,
        fulfillmentType,
        categoryFulfillmentTypes,
        timeSlotSelections: formData.deliveryTimeSlotSelections,
        onOrderSuccess
      }, paymentProof);
    } catch (error: any) {
      console.error('Order submission error:', error);
      // The toast is already shown in the submitOrder function
    }
  };

  const handleDeliveryTimeSlotSelectionChange = (categoryId: string, selection: DeliveryTimeSlotSelection) => {
    handleTimeSlotSelectionChange(categoryId, selection);
  };

  const handleNotesTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleNotesChange(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DeliveryForm
        deliveryDates={formData.deliveryDates}
        notes={formData.notes}
        onDateChange={handleDateChange}
        onNotesChange={handleNotesTextChange}
        pickupDetail={Object.values(formData.pickupDetails)[0] || null}
        onPickupDetailChange={(detail) => handlePickupDetailChange(Object.keys(formData.pickupDetails)[0] || 'default', detail)}
        fulfillmentType={fulfillmentType}
        onFulfillmentTypeChange={handleFulfillmentTypeChange}
        deliveryAddress={formData.deliveryAddress || ''}
        onDeliveryAddressChange={handleDeliveryAddressChange}
        categoryFulfillmentTypes={categoryFulfillmentTypes}
        onCategoryFulfillmentTypeChange={handleCategoryFulfillmentTypeChange}
        deliveryTimeSlotSelections={formData.deliveryTimeSlotSelections}
        onDeliveryTimeSlotSelectionChange={handleDeliveryTimeSlotSelectionChange}
      />

      <PaymentInstructions
        paymentProof={paymentProof}
        onFileChange={handleFileChange}
      />

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isUploading || isSubmitting}
      >
        {(isUploading || isSubmitting) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('checkout.processing')}
          </>
        ) : (
          t('checkout.submit')
        )}
      </Button>
    </form>
  );
}
