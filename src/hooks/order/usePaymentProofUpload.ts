import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentProofUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadPaymentProof = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      return uploadData.path;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadPaymentProof,
    isUploading
  };
}