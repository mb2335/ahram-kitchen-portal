import { useState } from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';

interface PaymentProofProps {
  paymentProofUrl: string;
}

export function PaymentProof({ paymentProofUrl }: PaymentProofProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleViewPaymentProof = async () => {
    try {
      const { data } = await supabase.storage
        .from('payment_proofs')
        .createSignedUrl(paymentProofUrl, 60);

      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error fetching payment proof:', error);
    }
  };

  return (
    <div className="border-t pt-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleViewPaymentProof}
          >
            <Image className="h-4 w-4" />
            View Payment Proof
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {imageUrl && (
            <div className="relative aspect-video">
              <img
                src={imageUrl}
                alt="Payment proof"
                className="rounded-lg object-contain w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}