import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      const mappedData = data?.map(item => ({
        ...item,
        remaining_quantity: item.quantity_limit,
      }));

      console.log('Fetched menu items:', mappedData);
      return mappedData || [];
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
};