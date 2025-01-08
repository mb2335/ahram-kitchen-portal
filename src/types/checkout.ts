import { PickupDetail } from './pickup';

export interface CheckoutFormData {
  notes: string;
  deliveryDates: Record<string, Date>;
  pickupDetails: Record<string, PickupDetail>;
}

export interface CheckoutSubmissionData extends CheckoutFormData {
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
}