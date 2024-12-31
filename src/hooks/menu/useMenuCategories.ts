import { MenuItem } from "@/contexts/CartContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function useMenuCategories(menuItems: MenuItem[]) {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('menu_categories')
          .select('*')
          .order('order_index');
        
        if (error) {
          console.error('Error fetching categories:', error);
          toast({
            title: "Error",
            description: "Failed to load menu categories",
            variant: "destructive",
          });
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Unexpected error in useMenuCategories:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Only retry twice and not for 401 errors
      if (failureCount > 2) return false;
      if (error?.message?.includes('401')) return false;
      return true;
    },
    retryDelay: 1000,
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