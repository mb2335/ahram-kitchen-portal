
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type MenuItemChange = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

export const useMenuChannel = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const menuItemsChannel = supabase
      .channel('menu-items-updates')
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

    const menuCategoriesChannel = supabase
      .channel('menu-categories-updates')
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
        }
      )
      .on(
        'system',
        { event: 'error' },
        () => {
          toast({
            title: "Connection Error",
            description: "Having trouble receiving menu category updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Failed to connect to menu category updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    return () => {
      supabase.removeChannel(menuItemsChannel);
      supabase.removeChannel(menuCategoriesChannel);
    };
  }, [queryClient]);
};
