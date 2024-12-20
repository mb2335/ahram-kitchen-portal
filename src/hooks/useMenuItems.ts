import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      // Map quantity_limit to remaining_quantity
      const mappedData = data?.map(item => ({
        ...item,
        remaining_quantity: item.quantity_limit,
      }));

      console.log('Fetched menu items:', mappedData);
      return mappedData || [];
    },
    staleTime: 10000,
    gcTime: 15000
  });
};