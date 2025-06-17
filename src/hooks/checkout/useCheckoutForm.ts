
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

  // Helper function to get pickup time from selected pickup detail
  const getPickupTime = (fulfillmentType: string): string | null => {
    if (fulfillmentType !== 'pickup') return null;
    
    const pickupDetail = Object.values(formData.pickupDetails)[0];
    if (!pickupDetail) return null;
    
    // Return the time range if both start and end times are available
    if (pickupDetail.start_time && pickupDetail.end_time) {
      return `${pickupDetail.start_time} - ${pickupDetail.end_time}`;
    }
    
    // Return just the time if only one is available
    return pickupDetail.start_time || pickupDetail.time || null;
  };

  return {
    formData,
    handleDateChange,
    handleNotesChange,
    handlePickupDetailChange,
    handleDeliveryAddressChange,
    handleTimeSlotSelectionChange,
    getPickupTime
  };
}
