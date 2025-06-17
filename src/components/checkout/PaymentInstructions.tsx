
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard } from 'lucide-react';

interface PaymentInstructionsProps {
  total: number;
  paymentProofFile: File | null;
  onPaymentProofChange: (file: File | null) => void;
}

export function PaymentInstructions({ 
  total, 
  paymentProofFile, 
  onPaymentProofChange 
}: PaymentInstructionsProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onPaymentProofChange(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-medium mb-2">Order Total: ${total.toFixed(2)}</div>
            <p className="text-sm mb-3">
              Please send payment via Zelle to: <strong>kyjuri@gmail.com</strong> or via Venmo to: <strong>@juri_y</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentProof">Upload Payment Proof *</Label>
            <Input
              id="paymentProof"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {paymentProofFile && (
              <p className="text-xs text-green-600">
                File selected: {paymentProofFile.name}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
