import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('order_index');

        if (error) {
          console.error('Error fetching menu items:', error);
          toast({
            title: "Error",
            description: "Failed to load menu items. Please try again.",
            variant: "destructive",
          });
          throw error;
        }

        // Map quantity_limit to remaining_quantity
        return data?.map(item => ({
          ...item,
          remaining_quantity: item.quantity_limit,
        })) || [];

      } catch (error) {
        console.error('Unexpected error in useMenuItems:', error);
        throw error;
      }
    },
    staleTime: 30000,
    gcTime: 300000,
    retry: (failureCount, error) => {
      // Only retry twice and not for 401 errors
      if (failureCount > 2) return false;
      if (error?.message?.includes('401')) return false;
      return true;
    },
    retryDelay: 1000,
  });
};