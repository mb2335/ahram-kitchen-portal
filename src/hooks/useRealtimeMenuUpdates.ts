import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Keep track of active connections to prevent duplicate subscriptions
let activeMenuItemsChannel = false;
let activeCategoriesChannel = false;

export const useRealtimeMenuUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only create a subscription if one doesn't already exist
    if (!activeMenuItemsChannel) {
      console.log('Setting up menu items real-time connection');
      activeMenuItemsChannel = true;
      
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
          (error) => {
            console.error('Menu items real-time error:', error);
            activeMenuItemsChannel = false;
            toast({
              title: "Connection Error",
              description: "Having trouble receiving menu item updates. Please refresh the page.",
              variant: "destructive",
            });
          }
        )
        .subscribe((status) => {
          console.log('Menu items subscription status:', status);
          if (status !== 'SUBSCRIBED') {
            activeMenuItemsChannel = false;
          }
        });

      // Set up subscription for menu categories
      if (!activeCategoriesChannel) {
        console.log('Setting up menu categories real-time connection');
        activeCategoriesChannel = true;
        
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
            (error) => {
              console.error('Menu categories real-time error:', error);
              activeCategoriesChannel = false;
              toast({
                title: "Connection Error",
                description: "Having trouble receiving category updates. Please refresh the page.",
                variant: "destructive",
              });
            }
          )
          .subscribe((status) => {
            console.log('Menu categories subscription status:', status);
            if (status !== 'SUBSCRIBED') {
              activeCategoriesChannel = false;
            }
          });

        // Cleanup function to remove channels on component unmount
        return () => {
          console.log('Cleaning up realtime subscriptions');
          if (menuItemsChannel) {
            supabase.removeChannel(menuItemsChannel);
            activeMenuItemsChannel = false;
          }
          
          if (categoriesChannel) {
            supabase.removeChannel(categoriesChannel);
            activeCategoriesChannel = false;
          }
        };
      }
    }
    
    // If channels are already active, just return a cleanup that does nothing
    // to avoid creating duplicate subscriptions
    return () => {};
  }, [queryClient]);

  return null;
};
