
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useRealtimeMenuUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up a single channel for all menu-related tables
    const channel = supabase
      .channel('menu-updates-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu item change detected:', payload);
          // Invalidate both menu items and vendor menu items queries
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        (payload) => {
          console.log('Menu category change detected:', payload);
          // Invalidate both menu categories and vendor menu categories queries
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
      )
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
          console.error('Failed to establish a realtime connection');
          toast({
            title: "Connection Error",
            description: "Failed to connect to menu updates. Please refresh the page.",
            variant: "destructive",
          });
        } else if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to menu updates');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
    }
  };
}
