
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
import { getCommonPickupDays, isValidPickupDate } from '@/utils/pickupUnification';

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
    fulfillmentType: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    notes: string;
    deliveryDates: Record<string, Date>;
    pickupDetail: PickupDetail | null;
    fulfillmentType: string;
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
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [categoryFulfillmentTypes, setCategoryFulfillmentTypes] = useState<Record<string, string>>({});
  const { submitOrder, isUploading } = useOrderSubmission();
  const [commonPickupDays, setCommonPickupDays] = useState<number[]>([]);

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
  const categoriesWithItems = categories.filter(cat => itemCategoryIds.includes(cat.id));
  
  // Effect to set initial fulfillment types and find common pickup days
  useEffect(() => {
    if (!categories.length) return;
    
    // Find common pickup days across all categories with items
    const categoryPickupDays = categoriesWithItems.map(cat => cat.pickup_days || []);
    
    // Start with all days (0-6) and find the intersection
    let common = [0, 1, 2, 3, 4, 5, 6];
    
    categoryPickupDays.forEach(pickupDays => {
      if (pickupDays.length > 0) {
        common = common.filter(day => pickupDays.includes(day));
      }
    });
    
    setCommonPickupDays(common);
    
    // Initialize default category fulfillment types if empty
    if (Object.keys(categoryFulfillmentTypes).length === 0) {
      const newCategoryFulfillmentTypes: Record<string, string> = {};
      
      categoriesWithItems.forEach(category => {
        if (category?.fulfillment_types?.length) {
          // Default to delivery if available, otherwise pickup
          newCategoryFulfillmentTypes[category.id] = 
            category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) 
              ? FULFILLMENT_TYPE_DELIVERY 
              : FULFILLMENT_TYPE_PICKUP;
        }
      });
      
      if (Object.keys(newCategoryFulfillmentTypes).length > 0) {
        setCategoryFulfillmentTypes(newCategoryFulfillmentTypes);
      }
      
      // Set a default fulfillment type based on what's available across all categories
      const availableFulfillmentTypes = new Set<string>();
      categoriesWithItems.forEach(cat => {
        (cat.fulfillment_types || []).forEach(type => availableFulfillmentTypes.add(type));
      });
      
      if (availableFulfillmentTypes.size > 0) {
        const preferredType = availableFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY) 
          ? FULFILLMENT_TYPE_DELIVERY 
          : FULFILLMENT_TYPE_PICKUP;
          
        setFormData(prev => ({
          ...prev,
          fulfillmentType: preferredType
        }));
      }
    }
  }, [categories, items, categoryFulfillmentTypes]);

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
    setFormData(prev => ({
      ...prev,
      fulfillmentType: type
    }));
    
    // When switching to pickup, validate the pickup dates against common pickup days
    if (type === FULFILLMENT_TYPE_PICKUP) {
      const updatedDates = { ...formData.deliveryDates };
      let datesUpdated = false;
      
      Object.entries(updatedDates).forEach(([categoryId, date]) => {
        // Check if date is valid for pickup
        if (!isValidPickupDate(date, commonPickupDays)) {
          // Find the next valid pickup date
          const today = new Date();
          let nextValidDate = new Date(today);
          
          // Sort pickup days for finding next day (0=Sunday, 1=Monday, etc.)
          const sortedDays = [...commonPickupDays].sort();
          const dayOfWeek = today.getDay();
          
          // Find the next valid day
          const nextDays = sortedDays.filter(day => day >= dayOfWeek);
          
          if (nextDays.length > 0) {
            // There's a valid day later this week
            const daysToAdd = nextDays[0] - dayOfWeek;
            nextValidDate.setDate(today.getDate() + daysToAdd);
          } else if (sortedDays.length > 0) {
            // Need to go to next week
            const daysToAdd = (7 - dayOfWeek) + sortedDays[0];
            nextValidDate.setDate(today.getDate() + daysToAdd);
          }
          
          updatedDates[categoryId] = nextValidDate;
          datesUpdated = true;
        }
      });
      
      // Update dates if any were invalid
      if (datesUpdated) {
        setFormData(prev => ({
          ...prev,
          deliveryDates: updatedDates
        }));
      }
    }
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

    // For pickup orders, ensure a unified pickup date and location
    if (formData.fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      // Verify all dates are the same for pickup
      const pickupDates = Object.values(formData.deliveryDates);
      
      if (pickupDates.length > 1) {
        const firstDate = pickupDates[0];
        const differentDates = pickupDates.some(date => 
          date.getFullYear() !== firstDate.getFullYear() ||
          date.getMonth() !== firstDate.getMonth() ||
          date.getDate() !== firstDate.getDate()
        );
        
        if (differentDates) {
          toast({
            title: 'Error',
            description: 'All items must be picked up on the same date. Please select a single pickup date for all items.',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Check if pickup detail is provided
      const needsPickupDetail = categoriesWithItems.some(cat => cat.has_custom_pickup);
      
      if (needsPickupDetail && !formData.pickupDetail) {
        toast({
          title: 'Error',
          description: 'Please select a pickup time and location',
          variant: 'destructive',
        });
        return;
      }
      
      // Ensure all pickup dates are valid pickup days
      const invalidDates = Object.entries(formData.deliveryDates).filter(([_, date]) => 
        !isValidPickupDate(date, commonPickupDays)
      );
      
      if (invalidDates.length > 0) {
        toast({
          title: 'Error',
          description: 'Selected pickup date is not a valid pickup day. Please choose from available pickup days.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Ensure we have dates for all categories
    const missingDates = itemCategoryIds.filter(categoryId => 
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

    // Check for delivery address
    const hasDeliveryItems = formData.fulfillmentType === FULFILLMENT_TYPE_DELIVERY || 
      Object.values(categoryFulfillmentTypes).includes(FULFILLMENT_TYPE_DELIVERY);
    
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
        deliveryDates: formData.deliveryDates,
        customerData: {
          ...customerData,
          address: deliveryAddress
        },
        pickupDetail: formData.pickupDetail,
        fulfillmentType: formData.fulfillmentType,
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
        fulfillmentType={formData.fulfillmentType}
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
