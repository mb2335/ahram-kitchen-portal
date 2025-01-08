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
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .on(
        'system',
        { event: 'error' },
        () => {
          toast({
            title: "Connection Error",
            description: "Having trouble receiving menu updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Failed to connect to menu updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};