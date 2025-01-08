import { useState } from 'react';
import { CheckoutFormData } from '@/types/checkout';
import { PickupDetail } from '@/types/pickup';

export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    notes: '',
    deliveryDates: {},
    pickupDetails: {}
  });

  const handleDateChange = (categoryId: string, date: Date) => {
    setFormData(prev => ({
      ...prev,
      deliveryDates: {
        ...prev.deliveryDates,
        [categoryId]: date
      }
    }));
  };

  const handleNotesChange = (notes: string) => {
    setFormData(prev => ({
      ...prev,
      notes
    }));
  };

  const handlePickupDetailChange = (categoryId: string, detail: PickupDetail) => {
    console.log('[useCheckoutForm] Updating pickup detail:', { categoryId, detail });
    setFormData(prev => ({
      ...prev,
      pickupDetails: {
        ...prev.pickupDetails,
        [categoryId]: detail
      }
    }));
  };

  return {
    formData,
    handleDateChange,
    handleNotesChange,
    handlePickupDetailChange
  };
}