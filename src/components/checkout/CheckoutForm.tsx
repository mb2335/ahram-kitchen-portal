
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form';
import { DeliveryForm } from './DeliveryForm';
import { PaymentInstructions } from './PaymentInstructions';
import { OrderConfirmation } from './OrderConfirmation';
import { useOrderSubmission } from './useOrderSubmission';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { OrderItem } from '@/types/order';
import { PickupDetail } from '@/types/pickup';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { LoadingState } from '@/components/shared/LoadingState';

interface CheckoutFormProps {
  formData: {
    notes: string;
    deliveryDates: Record<string, Date>;
    pickupDetail: PickupDetail | null;
  };
  setFormData: (data: any) => void;
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
  formData,
  setFormData,
  customerData,
  onOrderSuccess,
  total,
  taxAmount,
  items
}: CheckoutFormProps) {
  const { submitOrder, isUploading } = useOrderSubmission();
  const session = useSession();
  const { clearCart } = useCart();
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  // Added state for fulfillment type and delivery address
  const [fulfillmentType, setFulfillmentType] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [categoryFulfillmentTypes, setCategoryFulfillmentTypes] = useState<Record<string, string>>({});
  
  // Add debugging for dates
  useEffect(() => {
    if (Object.keys(formData.deliveryDates).length > 0) {
      console.log("All delivery dates after setting defaults:", formData.deliveryDates);
      
      Object.entries(formData.deliveryDates).forEach(([categoryId, date]) => {
        console.log(`Category ${categoryId} date:`, date);
        if (date instanceof Date) {
          console.log(`  ISO string: ${date.toISOString()}`);
        }
      });
    }
  }, [formData.deliveryDates]);

  const onDateChange = (categoryId: string, date: Date) => {
    console.log(`Date change for category ${categoryId}:`, date);
    console.log(`Date type:`, typeof date);
    console.log(`Is Date instance:`, date instanceof Date);
    
    setFormData({
      ...formData,
      deliveryDates: {
        ...formData.deliveryDates,
        [categoryId]: date
      }
    });
    
    // Verify the date was set correctly
    setTimeout(() => {
      console.log(`Verified date for category ${categoryId}:`, formData.deliveryDates[categoryId]);
    }, 100);
  };
  
  const onNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      notes: e.target.value
    });
  };

  const onPickupDetailChange = (detail: PickupDetail) => {
    setFormData({
      ...formData,
      pickupDetail: detail
    });
  };

  const onFulfillmentTypeChange = (type: string) => {
    setFulfillmentType(type);
  };

  const onDeliveryAddressChange = (address: string) => {
    setDeliveryAddress(address);
  };

  const onCategoryFulfillmentTypeChange = (categoryId: string, type: string) => {
    setCategoryFulfillmentTypes({
      ...categoryFulfillmentTypes,
      [categoryId]: type
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPaymentFile(e.target.files[0]);
    }
  };

  const onNextStep = () => {
    // Add validation before proceeding to next step
    if (step === 1) {
      // Validate delivery dates are set for all categories
      const categoryIds = [...new Set(items.map(item => item.category_id).filter(Boolean))];
      
      // Check if we have all required dates or if any are invalid
      const missingDates = categoryIds.filter(id => !formData.deliveryDates[id as string]);
      
      if (missingDates.length > 0) {
        alert(`Please select dates for all items in your order`);
        return;
      }
      
      // For pickup fulfillment, validate pickup details
      if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && !formData.pickupDetail) {
        alert('Please select pickup time and location');
        return;
      }
      
      // For delivery fulfillment, validate address
      if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && !deliveryAddress) {
        alert('Please provide a delivery address');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const onPrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentFile) {
      alert('Please upload your payment proof');
      return;
    }
    
    // Debug logging
    console.log("Submitting with delivery dates:", formData.deliveryDates);
    console.log("Category IDs in cart:", [...new Set(items.map(item => item.category_id).filter(Boolean))]);
    
    setIsSubmitting(true);
    
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
        fulfillmentType,
        categoryFulfillmentTypes,
        onOrderSuccess
      }, paymentFile);
      
      clearCart();
    } catch (error) {
      console.error('Failed to submit order:', error);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting || isUploading) {
    // Fix #1: LoadingState doesn't accept a message prop directly
    return (
      <div className="text-center py-12">
        <LoadingState />
        <p className="mt-4 text-gray-600">Processing your order...</p>
      </div>
    );
  }

  return (
    // Fix #2: Form from shadcn/ui doesn't accept onSubmit prop directly
    <form onSubmit={handleSubmit}>
      {step === 1 && (
        <DeliveryForm
          deliveryDates={formData.deliveryDates}
          notes={formData.notes}
          onDateChange={onDateChange}
          onNotesChange={onNotesChange}
          pickupDetail={formData.pickupDetail}
          onPickupDetailChange={onPickupDetailChange}
          fulfillmentType={fulfillmentType}
          onFulfillmentTypeChange={onFulfillmentTypeChange}
          deliveryAddress={deliveryAddress}
          onDeliveryAddressChange={onDeliveryAddressChange}
          categoryFulfillmentTypes={categoryFulfillmentTypes}
          onCategoryFulfillmentTypeChange={onCategoryFulfillmentTypeChange}
        />
      )}
      
      {step === 2 && (
        <div className="space-y-6">
          {/* Fix #3: Update PaymentInstructions props to match its interface */}
          <PaymentInstructions 
            paymentProof={paymentFile} 
            onFileChange={onFileChange}
          />
          <Separator />
          {/* Fix #4: Update OrderConfirmation props to match its interface */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            {items.map((item, index) => (
              <div key={index} className="flex justify-between mb-2">
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>
              <span>${(total + taxAmount).toFixed(2)}</span>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Customer Information</h4>
              <p>Name: {customerData.fullName}</p>
              <p>Email: {customerData.email}</p>
              <p>Phone: {customerData.phone}</p>
              {deliveryAddress && <p>Delivery Address: {deliveryAddress}</p>}
              {formData.notes && <p>Special Instructions: {formData.notes}</p>}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-6">
        {step > 1 && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onPrevStep}
          >
            Back
          </Button>
        )}
        
        <div className="ml-auto">
          {step < 2 ? (
            <Button 
              type="button" 
              onClick={onNextStep}
            >
              Continue to Payment
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={!paymentFile}
            >
              Place Order
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
