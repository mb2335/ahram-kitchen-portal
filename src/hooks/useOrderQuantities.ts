import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useOrderQuantities = () => {
  return useQuery({
    queryKey: ['order-quantities'],
    queryFn: async () => {
      try {
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

        if (error) throw error;

        const quantities: Record<string, number> = {};
        data?.forEach(item => {
          quantities[item.menu_item_id] = (quantities[item.menu_item_id] || 0) + item.quantity;
        });

        return quantities;
      } catch (error: any) {
        toast({
          title: "Error fetching quantities",
          description: "Failed to load item quantities",
          variant: "destructive",
        });
        return {};
      }
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};