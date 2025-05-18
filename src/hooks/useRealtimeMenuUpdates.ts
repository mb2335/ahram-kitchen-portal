
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useRealtimeMenuUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up subscription for menu items
    const menuItemsChannel = supabase
      .channel('menu-items-channel')
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
          
          // Show toast notification for reordering
          if (payload.eventType === 'UPDATE' && 
              payload.new && payload.old && 
              payload.new.order_index !== payload.old.order_index) {
            toast({
              title: "Menu item reordered",
              description: "Menu item order has been updated",
            });
          }
        }
      )
      .on(
        'system',
        { event: 'error' },
        () => {
          toast({
            title: "Connection Error",
            description: "Having trouble receiving menu item updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe();

    // Set up subscription for menu categories
    const categoriesChannel = supabase
      .channel('menu-categories-channel')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        (payload) => {
          console.log('Menu category change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
          
          // Show toast notification for reordering
          if (payload.eventType === 'UPDATE' && 
              payload.new && payload.old && 
              payload.new.order_index !== payload.old.order_index) {
            toast({
              title: "Category reordered",
              description: "Category order has been updated",
            });
          }
        }
      )
      .on(
        'system',
        { event: 'error' },
        () => {
          toast({
            title: "Connection Error",
            description: "Having trouble receiving category updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe();

    // Cleanup function to remove channels on component unmount
    return () => {
      supabase.removeChannel(menuItemsChannel);
      supabase.removeChannel(categoriesChannel);
      console.log('Cleaning up realtime subscriptions');
    };
  }, [queryClient]);

  return null;
};
