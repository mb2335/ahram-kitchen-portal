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
          .order('order_index', { ascending: true });

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
        const mappedData = data?.map(item => ({
          ...item,
          remaining_quantity: item.quantity_limit,
        }));

        console.log('Successfully fetched menu items:', mappedData);
        return mappedData || [];
      } catch (error) {
        console.error('Unexpected error in useMenuItems:', error);
        throw error;
      }
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000,   // Keep unused data in cache for 5 minutes
    retry: 1,         // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });
};