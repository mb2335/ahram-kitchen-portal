
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  name: string;
  instructions: string;
  details: string;
}

interface PaymentInstructionsProps {
  paymentProof: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  paymentMethods?: PaymentMethod[];
}

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'zelle',
    name: 'Zelle',
    instructions: 'Send payment via Zelle to:',
    details: 'kyjuri@gmail.com'
  },
  {
    id: 'venmo',
    name: 'Venmo',
    instructions: 'Send payment via Venmo to:',
    details: '@juri_y'
  }
];

export function PaymentInstructions({ 
  paymentProof, 
  onFileChange,
  paymentMethods = DEFAULT_PAYMENT_METHODS
}: PaymentInstructionsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(paymentMethods[0]?.id || '');
  
  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
  };

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);

  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
      <h3 className="font-semibold">Payment Instructions</h3>
      
      {paymentMethods.length > 1 && (
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <RadioGroup 
            value={selectedMethod} 
            onValueChange={handleMethodChange}
            className="flex flex-col space-y-1"
          >
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                <Label 
                  htmlFor={`payment-${method.id}`}
                  className={cn(
                    "cursor-pointer",
                    selectedMethod === method.id ? "font-medium" : ""
                  )}
                >
                  {method.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {selectedPaymentMethod && (
        <div className="text-sm space-y-1">
          <p>{selectedPaymentMethod.instructions}</p>
          <p className="font-semibold">{selectedPaymentMethod.details}</p>
        </div>
      )}

      <div className="pt-2">
        <Label htmlFor="paymentProof">Upload Screenshot as Payment Proof</Label>
        <Input
          id="paymentProof"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          required
          className="mt-1"
        />
        {paymentProof && (
          <p className="text-xs text-green-600 mt-1">
            File selected: {paymentProof.name}
          </p>
        )}
      </div>
    </div>
  );
}
