
import { PickupDetail } from './pickup';
import { DeliveryTimeSlotSelection } from './delivery';

export interface CheckoutFormData {
  notes: string;
  deliveryDates: Record<string, Date>;
  pickupDetails: Record<string, PickupDetail>;
  deliveryAddress?: string;
  deliveryTimeSlotSelections?: Record<string, DeliveryTimeSlotSelection>;
}

export interface CheckoutSubmissionData extends CheckoutFormData {
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
}
