
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onPaymentProofChange(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t('checkout.payment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-medium mb-2">{t('checkout.payment.total')}: ${total.toFixed(2)}</div>
            <p className="text-sm mb-3">
              {t('checkout.payment.instructions')
                .replace('{zelle}', 'kyjuri@gmail.com')
                .replace('{venmo}', '@juri_y')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentProof">{t('checkout.payment.proof')} *</Label>
            <Input
              id="paymentProof"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {paymentProofFile && (
              <p className="text-xs text-green-600">
                {t('checkout.payment.file.selected').replace('{filename}', paymentProofFile.name)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
