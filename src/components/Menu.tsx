import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, MenuItem } from "@/contexts/CartContext";
import { MenuGrid } from "./menu/MenuGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export function Menu() {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [orderedQuantities, setOrderedQuantities] = useState<Record<string, number>>({});

  // Fetch ordered quantities for menu items
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
        .in('orders.status', ['pending', 'confirmed']);

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
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: menuItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      console.log('Fetching menu items...');
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

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
    }
  });

  // Subscribe to real-time updates for menu_items and order_items
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
          refetch();
        }
      )
      .subscribe();

    // Channel for order item updates
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
          refetchOrderQuantities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [refetch, refetchOrderQuantities]);

  if (error) {
    console.error('Error in menu component:', error);
    toast({
      title: "Error",
      description: "Failed to load menu items. Please try again later.",
      variant: "destructive",
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
            Discover our selection of authentic Korean dishes, carefully prepared and beautifully presented
          </p>
        </div>
        <MenuGrid items={menuItems} onAddToCart={addItem} />
      </div>
    </div>
  );
}