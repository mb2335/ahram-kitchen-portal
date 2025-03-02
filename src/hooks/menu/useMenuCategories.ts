
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
      
      // Map data and add allow_joint_pickup if it doesn't exist
      return (data || []).map(category => ({
        ...category,
        allow_joint_pickup: category.allow_joint_pickup ?? false, // Default to false if not present
      }));
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
