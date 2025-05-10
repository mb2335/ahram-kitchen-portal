
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMenuItems } from '../useMenuItems';
import { useOrderQuantities } from '../useOrderQuantities';

export function useMenuWithRealtime() {
  const queryClient = useQueryClient();
  const menuItemsQuery = useMenuItems();
  const orderQuantitiesQuery = useOrderQuantities();

  useEffect(() => {
    // Set up menu items channel
    const menuChannel = supabase
      .channel('menu-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu item change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe();

    // Set up orders channel
    const orderChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_items' 
        },
        () => {
          console.log('Order item change detected');
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          orderQuantitiesQuery.refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [queryClient, orderQuantitiesQuery]);

  return {
    menuItems: menuItemsQuery.data || [],
    isLoading: menuItemsQuery.isLoading,
    error: menuItemsQuery.error,
    orderQuantities: orderQuantitiesQuery.data || {},
    refetchOrderQuantities: orderQuantitiesQuery.refetch,
  };
}
