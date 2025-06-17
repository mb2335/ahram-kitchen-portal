
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { OrderSubmissionProps } from '@/types/order';
import { FulfillmentSelector } from './FulfillmentSelector';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { useOrderSubmission } from './useOrderSubmission';
import { useDeliveryEligibility } from '@/hooks/cart/useDeliveryEligibility';
import { addDays } from 'date-fns';

interface CheckoutFormProps {
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    smsOptIn: boolean;
    address?: string;
  };
  onOrderSuccess: (orderId: string, isAuthenticated: boolean) => void;
  total: number;
  items: any[];
  onSmsOptInRequired: () => void;
}

export function CheckoutForm({
  customerData,
  onOrderSuccess,
  total,
  items,
  onSmsOptInRequired
}: CheckoutFormProps) {
  const { toast } = useToast();
  const { submitOrder, isSubmitting, isUploading } = useOrderSubmission();
  const { isDeliveryEligible } = useDeliveryEligibility();
  
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryDate, setDeliveryDate] = useState<Date>(addDays(new Date(), 3));
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  // Auto-switch to pickup if delivery becomes unavailable
  useEffect(() => {
    if (fulfillmentType === 'delivery' && !isDeliveryEligible) {
      setFulfillmentType('pickup');
      toast({
        title: "Switched to Pickup",
        description: "Your cart no longer meets delivery requirements. Switched to pickup.",
        variant: "default",
      });
    }
  }, [isDeliveryEligible, fulfillmentType, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.smsOptIn) {
      onSmsOptInRequired();
      return;
    }

    if (fulfillmentType === 'delivery' && !isDeliveryEligible) {
      toast({
        title: "Delivery Not Available",
        description: "Your cart doesn't meet the minimum requirements for delivery.",
        variant: "destructive",
      });
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: "Delivery Address Required",
        description: "Please provide a delivery address.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentProofFile) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload payment proof to complete your order.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderProps: OrderSubmissionProps = {
        items,
        total,
        notes,
        deliveryDates: { [fulfillmentType]: deliveryDate },
        customerData: {
          ...customerData,
          address: fulfillmentType === 'delivery' ? deliveryAddress : undefined,
        },
        pickupDetail: null,
        fulfillmentType,
        onOrderSuccess,
      };

      await submitOrder(orderProps, paymentProofFile);
    } catch (error) {
      console.error('Order submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FulfillmentSelector
        selectedType={fulfillmentType}
        onTypeChange={setFulfillmentType}
      />

      <DeliveryForm
        deliveryDate={deliveryDate}
        notes={notes}
        onDateChange={setDeliveryDate}
        onNotesChange={(e) => setNotes(e.target.value)}
        fulfillmentType={fulfillmentType}
        deliveryAddress={deliveryAddress}
        onDeliveryAddressChange={setDeliveryAddress}
      />

      <PaymentInstructions
        total={total}
        paymentProofFile={paymentProofFile}
        onPaymentProofChange={setPaymentProofFile}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting || isUploading}
      >
        {isUploading ? 'Uploading Payment Proof...' : isSubmitting ? 'Placing Order...' : 'Place Order'}
      </Button>
    </form>
  );
}
