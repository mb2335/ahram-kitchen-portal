import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, MenuItem } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export function Menu() {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const [orderedQuantities, setOrderedQuantities] = useState<Record<string, number>>({});

  // Fetch ordered quantities for menu items - now using the same logic for all users
  const { data: orderQuantities = {}, refetch: refetchOrderQuantities } = useQuery({
    queryKey: ['order-quantities'],
    queryFn: async () => {
      console.log('Fetching order quantities...');
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item_id,
          orders!inner (
            status
          )
        `)
        .neq('orders.status', 'rejected');

      if (error) {
        console.error('Error fetching order quantities:', error);
        throw error;
      }

      // Calculate total ordered quantity per menu item
      const quantities: Record<string, number> = {};
      data?.forEach(item => {
        quantities[item.menu_item_id] = (quantities[item.menu_item_id] || 0) + item.quantity;
      });

      console.log('Order quantities fetched:', quantities);
      return quantities;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 15000 // Keep in garbage collection for 15 seconds
  });

  const { data: menuItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching menu items:', error);
        throw error;
      }

      console.log('Fetched menu items:', data);

      if (!data || data.length === 0) {
        console.log('No menu items found');
        return [];
      }

      return data.map(item => ({
        id: item.id,
        vendor_id: item.vendor_id,
        name: item.name,
        nameKo: item.name_ko,
        description: item.description || '',
        descriptionKo: item.description_ko || '',
        price: Number(item.price),
        image: item.image || '/placeholder.svg',
        quantity_limit: item.quantity_limit,
        remaining_quantity: item.quantity_limit 
          ? item.quantity_limit - (orderQuantities[item.id] || 0)
          : null
      }));
    },
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 15000 // Keep in garbage collection for 15 seconds
  });

  // Subscribe to real-time updates for both menu_items and orders
  useEffect(() => {
    // Channel for menu item updates
    const menuChannel = supabase
      .channel('menu-updates')
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
          refetch();
        }
      )
      .subscribe();

    // Channel for order updates (both items and status changes)
    const orderChannel = supabase
      .channel('order-updates')
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
          console.log('Order status change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['order-quantities'] });
          refetchOrderQuantities();
        }
      )
      .subscribe();

    // Handle potential connection issues
    menuChannel.on('error', () => {
      toast({
        title: "Connection Error",
        description: "Having trouble receiving updates. Please refresh the page.",
        variant: "destructive"
      });
    });

    orderChannel.on('error', () => {
      toast({
        title: "Connection Error",
        description: "Having trouble receiving updates. Please refresh the page.",
        variant: "destructive"
      });
    });

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [refetch, refetchOrderQuantities, queryClient]);

  if (error) {
    console.error('Error in menu component:', error);
    toast({
      title: "Error",
      description: "Failed to load menu items. Please try again later.",
      variant: "destructive"
    });
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">
          Failed to load menu items. Please try again later.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading menu items...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('menu.title')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('menu.description')}
          </p>
        </div>
        <MenuGrid items={menuItems} onAddToCart={addItem} />
      </div>
    </div>
  );
}