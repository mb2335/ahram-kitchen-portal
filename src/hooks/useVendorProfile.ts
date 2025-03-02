
import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';

interface VendorData {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  user_id: string;
  is_active: boolean;
}

export function useVendorProfile() {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const session = useSession();

  useEffect(() => {
    async function fetchVendorProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        
        console.log('Loaded vendor profile:', data);
        setVendorData(data);
      } catch (err: any) {
        console.error('Error fetching vendor profile:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVendorProfile();
  }, [session?.user?.id]);

  return { vendorData, loading, error };
}
