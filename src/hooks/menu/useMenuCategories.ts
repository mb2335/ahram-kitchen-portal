
import { MenuItem } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMenuCategories(menuItems: MenuItem[]) {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      // Check if we have an active session for better error handling
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) {
        console.error("Error loading menu categories:", error);
        throw error;
      }
      
      return data.map(category => ({
        ...category,
        fulfillment_types: category.fulfillment_types || []
      }));
    },
    retry: 1,
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
