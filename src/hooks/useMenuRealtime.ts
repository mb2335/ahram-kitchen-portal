import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to menu item changes
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

    // Subscribe to order and order item changes
    const orderChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('Order item change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          refetchOrderQuantities();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order status change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          refetchOrderQuantities();
        }
      )
      .subscribe();

    const handleError = () => {
      toast({
        title: "Connection Error",
        description: "Having trouble receiving updates. Please refresh the page.",
        variant: "destructive"
      });
    };

    menuChannel.on('error', handleError);
    orderChannel.on('error', handleError);

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [queryClient, refetchOrderQuantities]);
};