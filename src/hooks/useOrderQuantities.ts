import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useOrderQuantities = () => {
  return useQuery({
    queryKey: ['order-quantities'],
    queryFn: async () => {
      console.log('Fetching order quantities...');
      try {
        // Modified query to include all orders regardless of customer type
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            quantity,
            menu_item_id,
            orders!inner (
              status
            )
          `)
          .in('orders.status', ['pending', 'confirmed']);

        if (error) {
          console.error('Error fetching order quantities:', error);
          throw error;
        }

        // Calculate quantities per menu item
        const quantities: Record<string, number> = {};
        data?.forEach(item => {
          quantities[item.menu_item_id] = (quantities[item.menu_item_id] || 0) + item.quantity;
        });

        console.log('Order quantities fetched:', quantities);
        return quantities;
      } catch (error: any) {
        console.error('Error in useOrderQuantities:', error);
        toast({
          title: "Error fetching quantities",
          description: "Failed to load item quantities",
          variant: "destructive",
        });
        return {};
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });
};