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
        .eq('is_available', true)
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
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};