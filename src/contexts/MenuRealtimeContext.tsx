
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { RealtimeChannel } from '@supabase/supabase-js';

interface MenuRealtimeContextType {
  isConnected: boolean;
  refetchOrderQuantities: () => void;
}

const MenuRealtimeContext = createContext<MenuRealtimeContextType | undefined>(undefined);

export const useMenuRealtimeContext = () => {
  const context = useContext(MenuRealtimeContext);
  if (!context) {
    throw new Error('useMenuRealtimeContext must be used within a MenuRealtimeProvider');
  }
  return context;
};

interface MenuRealtimeProviderProps {
  children: ReactNode;
  refetchOrderQuantities?: () => void;
}

export const MenuRealtimeProvider = ({ 
  children,
  refetchOrderQuantities = () => {} 
}: MenuRealtimeProviderProps) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  useEffect(() => {
    console.log('Setting up centralized menu realtime subscriptions...');
    
    // Create a single channel for menu items
    const menuItemsChannel = supabase
      .channel('centralized-menu-items-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        (payload) => {
          console.log('Menu item change detected (centralized):', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to menu items updates');
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to connect to menu items updates');
          setIsConnected(false);
          toast({
            title: "Connection Error",
            description: "Having trouble receiving menu updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    // Create a single channel for menu categories
    const menuCategoriesChannel = supabase
      .channel('centralized-menu-categories-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        (payload) => {
          console.log('Menu category change detected (centralized):', payload);
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to connect to menu category updates');
          toast({
            title: "Connection Error",
            description: "Failed to connect to menu category updates. Please refresh the page.",
            variant: "destructive",
          });
        }
      });

    // Create a single channel for order updates
    const orderChannel = supabase
      .channel('centralized-order-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_items' 
        },
        (payload) => {
          console.log('Order item change detected (centralized):', payload);
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
          console.log('Order status change detected (centralized):', payload);
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          refetchOrderQuantities();
        }
      )
      .subscribe();

    setChannels([menuItemsChannel, menuCategoriesChannel, orderChannel]);

    // Clean up all channels on unmount
    return () => {
      console.log('Cleaning up centralized menu realtime subscriptions...');
      [menuItemsChannel, menuCategoriesChannel, orderChannel].forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [queryClient, refetchOrderQuantities]);

  const value = {
    isConnected,
    refetchOrderQuantities,
  };

  return (
    <MenuRealtimeContext.Provider value={value}>
      {children}
    </MenuRealtimeContext.Provider>
  );
};
