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
    const channel = supabase
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
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to menu updates');
          toast({
            title: "Connection Error",
            description: "Failed to connect to menu updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    return () => {
      console.log('Cleaning up menu channel subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};