
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDeliveryRulesDebug = () => {
  const { data: debugInfo, isLoading } = useQuery({
    queryKey: ['delivery-rules-debug'],
    queryFn: async () => {
      console.log('[Delivery Rules Debug] Starting comprehensive table check...');
      
      // Check if the table exists and we can access it
      try {
        const { data: allRules, error: allError } = await supabase
          .from('delivery_rules')
          .select('*');

        if (allError) {
          console.error('[Delivery Rules Debug] Error accessing delivery_rules table:', allError);
          return {
            success: false,
            error: allError,
            totalRules: 0,
            activeRules: 0,
            rules: []
          };
        }

        console.log('[Delivery Rules Debug] Successfully fetched all rules:', allRules?.length || 0);
        console.log('[Delivery Rules Debug] All rules data:', allRules);

        const activeRules = allRules?.filter(rule => rule.is_active) || [];
        console.log('[Delivery Rules Debug] Active rules count:', activeRules.length);
        console.log('[Delivery Rules Debug] Active rules data:', activeRules);

        return {
          success: true,
          error: null,
          totalRules: allRules?.length || 0,
          activeRules: activeRules.length,
          rules: allRules || []
        };
      } catch (error) {
        console.error('[Delivery Rules Debug] Unexpected error:', error);
        return {
          success: false,
          error: error,
          totalRules: 0,
          activeRules: 0,
          rules: []
        };
      }
    },
    refetchOnWindowFocus: false,
  });

  return {
    debugInfo,
    isLoading
  };
};
