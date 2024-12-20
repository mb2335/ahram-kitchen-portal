import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type MenuItemChange = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  const queryClient = useQueryClient();

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
        (payload: MenuItemChange) => {
          console.log('Menu item change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .on(
        'system',
        { event: 'error' },
        (error) => {
          console.error('Menu channel error:', error);
          toast({
            title: "Connection Error",
            description: "Having trouble receiving menu updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to menu updates');
        }
      });

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
        (payload: MenuItemChange) => {
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
        (payload: MenuItemChange) => {
          console.log('Order status change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          refetchOrderQuantities();
        }
      )
      .on(
        'system',
        { event: 'error' },
        (error) => {
          console.error('Order channel error:', error);
          toast({
            title: "Connection Error",
            description: "Having trouble receiving order updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to order updates');
        }
      });

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [queryClient, refetchOrderQuantities]);
};