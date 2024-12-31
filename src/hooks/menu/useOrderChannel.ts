import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type OrderChange = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

export const useOrderChannel = (refetchOrderQuantities: () => void) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_items' 
        },
        (payload: OrderChange) => {
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
        (payload: OrderChange) => {
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
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to order updates');
          toast({
            title: "Connection Error",
            description: "Failed to connect to order updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    return () => {
      console.log('Cleaning up order channel subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetchOrderQuantities]);
};