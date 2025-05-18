
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook that sets up realtime subscriptions for menu items and categories.
 * This centralizes the subscription logic across the app.
 */
export function useRealtimeMenuUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime menu subscriptions');
    
    // Menu items channel
    const menuChannel = supabase
      .channel('menu-items-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu item update detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe((status) => {
        console.log('Menu items subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to menu items changes');
        }
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Issue with menu updates. Changes may not appear in real-time.",
            variant: "destructive",
          });
        }
      });

    // Categories channel
    const categoryChannel = supabase
      .channel('menu-categories-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        (payload) => {
          console.log('Category update detected:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
      )
      .subscribe((status) => {
        console.log('Category subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to category changes');
        }
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Issue with category updates. Changes may not appear in real-time.",
            variant: "destructive",
          });
        }
      });

    // Clean up subscriptions when component unmounts
    return () => {
      console.log('Cleaning up realtime menu subscriptions');
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, [queryClient]);
}
