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
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      return data || [];
    },
    retry: false,
    refetchOnWindowFocus: false
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