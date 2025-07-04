
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
import { useEnhancedDeliveryEligibility } from '@/hooks/cart/useEnhancedDeliveryEligibility';
import { FulfillmentSettings } from './fulfillment/FulfillmentSettings';
import { useLanguage } from '@/hooks/useLanguage';
import { useCheckoutForm } from '@/hooks/checkout/useCheckoutForm';
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
  const { t } = useLanguage();
  const { submitOrder, isSubmitting, isUploading } = useOrderSubmission();
  // Use enhanced delivery eligibility for all customers (guest and authenticated)
  const { isDeliveryEligible, deliveryRulesSummary } = useEnhancedDeliveryEligibility();
  const { 
    formData, 
    handleDateChange, 
    handleNotesChange, 
    handlePickupDetailChange, 
    handleDeliveryAddressChange, 
    handleTimeSlotSelectionChange,
    getPickupTime 
  } = useCheckoutForm();
  
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryDate, setDeliveryDate] = useState<Date>(addDays(new Date(), 3));
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [selectedDates, setSelectedDates] = useState<Record<string, Date>>({});
  const [selectedPickupDetail, setSelectedPickupDetail] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Auto-switch to pickup if delivery becomes unavailable for ALL users
  useEffect(() => {
    if (fulfillmentType === 'delivery' && !isDeliveryEligible) {
      setFulfillmentType('pickup');
      
      // Show specific message about delivery requirements
      const ruleMessage = deliveryRulesSummary.length > 0 
        ? `Please add more items to meet delivery requirements: ${deliveryRulesSummary.map(rule => 
            `${rule.minimum_items}+ items from ${rule.category?.name || 'Unknown Category'}`
          ).join(' OR ')}`
        : "Your cart doesn't meet the minimum requirements for delivery.";
        
      toast({
        title: "Switched to Pickup",
        description: ruleMessage,
        variant: "default",
      });
    }
  }, [isDeliveryEligible, fulfillmentType, toast, deliveryRulesSummary]);

  const handleDateChangeWrapper = (type: string, date: Date) => {
    handleDateChange(type, date);
    setSelectedDates(prev => ({
      ...prev,
      [type]: date
    }));
    if (type === fulfillmentType) {
      setDeliveryDate(date);
    }
  };

  const handlePickupDetailChangeWrapper = (detail: any) => {
    setSelectedPickupDetail(detail);
    handlePickupDetailChange(fulfillmentType, detail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.smsOptIn) {
      onSmsOptInRequired();
      return;
    }

    // Enhanced delivery eligibility check applies to ALL users
    if (fulfillmentType === 'delivery' && !isDeliveryEligible) {
      const ruleMessage = deliveryRulesSummary.length > 0 
        ? `Please add more items to meet delivery requirements: ${deliveryRulesSummary.map(rule => 
            `${rule.minimum_items}+ items from ${rule.category?.name || 'Unknown Category'}`
          ).join(' OR ')}`
        : "Your cart doesn't meet the minimum requirements for delivery.";
        
      toast({
        title: t('checkout.error.delivery'),
        description: ruleMessage,
        variant: "destructive",
      });
      return;
    }

    if (fulfillmentType === 'delivery' && !formData.deliveryAddress?.trim()) {
      toast({
        title: "Delivery Address Required",
        description: t('checkout.error.address'),
        variant: "destructive",
      });
      return;
    }

    if (fulfillmentType === 'pickup' && !selectedPickupDetail) {
      toast({
        title: "Pickup Details Required",
        description: t('checkout.error.pickup'),
        variant: "destructive",
      });
      return;
    }

    if (fulfillmentType === 'delivery' && !selectedTimeSlot) {
      toast({
        title: "Delivery Time Required",
        description: "Please select a delivery time slot.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentProofFile) {
      toast({
        title: "Payment Proof Required",
        description: t('checkout.error.payment'),
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the pickup time from selected pickup detail
      const pickupTime = getPickupTime(fulfillmentType);
      
      const orderProps: OrderSubmissionProps = {
        items,
        total,
        notes: formData.notes,
        deliveryDates: { [fulfillmentType]: deliveryDate },
        customerData: {
          ...customerData,
          address: fulfillmentType === 'delivery' ? formData.deliveryAddress : undefined,
        },
        pickupDetail: selectedPickupDetail,
        pickupTime: pickupTime,
        fulfillmentType,
        onOrderSuccess,
      };
      
      // Pass the selected delivery time slot to the order submission
      await submitOrder(orderProps, paymentProofFile, selectedTimeSlot);
    } catch (error) {
      console.error('Order submission failed:', error);
    }
  };

  const usedFulfillmentTypes = new Set([fulfillmentType]);

  return (
    <div className="space-y-8">
      <FulfillmentSelector
        selectedType={fulfillmentType}
        onTypeChange={setFulfillmentType}
      />

      <FulfillmentSettings
        selectedDates={selectedDates}
        onDateChange={handleDateChangeWrapper}
        onPickupDetailChange={handlePickupDetailChangeWrapper}
        selectedPickupDetail={selectedPickupDetail}
        onDeliveryTimeSlotChange={setSelectedTimeSlot}
        selectedTimeSlot={selectedTimeSlot}
        usedFulfillmentTypes={usedFulfillmentTypes}
      />

      {fulfillmentType === 'delivery' && (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
              {t('delivery.address')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <label htmlFor="delivery-address" className="text-sm font-medium text-gray-700">
                {t('checkout.delivery.address')}
              </label>
              <input
                id="delivery-address"
                type="text"
                value={formData.deliveryAddress || ''}
                onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                placeholder={t('checkout.delivery.address.placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show delivery requirements message for all users when delivery is not available */}
      {fulfillmentType === 'delivery' && !isDeliveryEligible && deliveryRulesSummary.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="text-sm text-orange-800">
              <strong>Delivery Requirements:</strong> To enable delivery, you need: {
                deliveryRulesSummary.map((rule, index) => (
                  <span key={rule.id}>
                    {index > 0 && ' OR '}
                    {rule.minimum_items}+ items from {rule.category?.name || 'Unknown Category'}
                  </span>
                ))
              }
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-800">
            {t('order.notes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700">
              {t('checkout.notes')}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={t('checkout.notes.placeholder')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <PaymentInstructions
        total={total}
        paymentProofFile={paymentProofFile}
        onPaymentProofChange={setPaymentProofFile}
      />

      <Separator className="my-8" />

      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {t('checkout.summary')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-between items-center text-xl font-bold text-gray-800">
            <span>{t('checkout.total')}</span>
            <span className="text-green-600">${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        onClick={handleSubmit}
        className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
        size="lg"
        disabled={isSubmitting || isUploading}
      >
        {isUploading 
          ? 'Uploading Payment Proof...' 
          : isSubmitting 
            ? t('checkout.processing')
            : t('checkout.submit')
        }
      </Button>
    </div>
  );
}
