
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PaymentInstructionsProps {
  paymentProof: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PaymentInstructions({ paymentProof, onFileChange }: PaymentInstructionsProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Payment Instructions</h3>
      <p className="text-sm mb-4">
        Please send payment via Zelle to: <strong>kyjuri@gmail.com</strong> or via Venmo to: <strong>@juri_y</strong>
      </p>
      <div>
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
