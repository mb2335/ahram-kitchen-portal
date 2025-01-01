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
        Please send payment via Zelle to: <strong>your.new.email@example.com</strong>
      </p>
      <div>
        <Label htmlFor="paymentProof">Upload Payment Proof</Label>
        <Input
          id="paymentProof"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          required
          className="mt-1"
        />
      </div>
    </div>
  );
}