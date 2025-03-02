
export interface Notification {
  id: string;
  vendor_id: string;
  message: string;
  send_method: 'email' | 'sms' | 'both';
  created_at: string;
  filters: Record<string, any>;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  customer_id: string;
  order_id?: string;
  status: 'sent' | 'delivered' | 'failed';
  created_at: string;
  customer?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export interface NotificationFormData {
  message: string;
  sendMethod: 'email' | 'sms' | 'both';
  date?: Date;
  pickupLocation?: string;
  fulfillmentType?: string;
  searchQuery?: string;
}
