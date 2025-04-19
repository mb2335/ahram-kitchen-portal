
import { useState } from 'react';
import { CheckoutFormData } from '@/types/checkout';
import { PickupDetail } from '@/types/pickup';
import { DeliveryTimeSlotSelection } from '@/types/delivery';

export function useCheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    notes: '',
    deliveryDates: {},
    pickupDetails: {},
    deliveryAddress: '',
    deliveryTimeSlotSelections: {}
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

  // Updated to accept string directly instead of event
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

  const handleDeliveryAddressChange = (address: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: address
    }));
  };

  const handleTimeSlotSelectionChange = (categoryId: string, selection: DeliveryTimeSlotSelection) => {
    console.log('[useCheckoutForm] Updating time slot selection:', { categoryId, selection });
    setFormData(prev => ({
      ...prev,
      deliveryTimeSlotSelections: {
        ...prev.deliveryTimeSlotSelections,
        [categoryId]: selection
      }
    }));
  };

  return {
    formData,
    handleDateChange,
    handleNotesChange,
    handlePickupDetailChange,
    handleDeliveryAddressChange,
    handleTimeSlotSelectionChange
  };
}
