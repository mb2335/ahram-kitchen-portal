import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export const useMenuItems = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu items changed, invalidating query...', payload);
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ 
            queryKey: ['menu-items'],
            refetchType: 'active',
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up menu channel subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
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

      console.log('Fetched menu items:', mappedData);
      return mappedData || [];
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000,   // Keep unused data in cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};