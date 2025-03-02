
import { MenuItem } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMenuCategories(menuItems: MenuItem[]) {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      
      return data.map(category => {
        // Ensure pickup_details are properly formatted with day information
        const pickup_details = (category.pickup_details || []).map((detail: any) => ({
          day: detail.day !== undefined ? detail.day : 0,
          time: detail.time || '',
          location: detail.location || ''
        }));
        
        return {
          ...category,
          pickup_details,
          fulfillment_types: category.fulfillment_types || [],
          pickup_days: category.pickup_days || [],
        };
      });
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const itemsByCategory = menuItems.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return { categories, itemsByCategory, isLoading: categoriesLoading };
}
