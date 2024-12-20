import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOrderQuantities = () => {
  return useQuery({
    queryKey: ['order-quantities'],
    queryFn: async () => {
      console.log('Fetching order quantities...');
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item_id,
          orders!inner (
            status
          )
        `)
        .neq('orders.status', 'rejected');

      if (error) {
        console.error('Error fetching order quantities:', error);
        throw error;
      }

      const quantities: Record<string, number> = {};
      data?.forEach(item => {
        quantities[item.menu_item_id] = (quantities[item.menu_item_id] || 0) + item.quantity;
      });

      console.log('Order quantities fetched:', quantities);
      return quantities;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    gcTime: 15000
  });
};