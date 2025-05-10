
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(
            id,
            name,
            name_ko
          )
        `)
        .order('order_index');

      if (error) throw error;

      return data?.map(item => ({
        ...item,
        remaining_quantity: item.quantity_limit,
        category: item.category ? {
          id: item.category.id,
          name: item.category.name,
          name_ko: item.category.name_ko
        } : null
      })) || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
};
