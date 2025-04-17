
import { useSession } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useVendorId() {
  const session = useSession();

  const { data: vendorId, isLoading } = useQuery({
    queryKey: ['vendor-id', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!session?.user?.id
  });

  return {
    vendorId,
    isLoading
  };
}
