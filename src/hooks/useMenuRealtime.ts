
import { useRealtime } from '@/contexts/RealtimeContext';
import { useEffect } from 'react';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  const { subscribe } = useRealtime();

  useEffect(() => {
    // Subscribe to menu_items table changes
    const unsubscribeMenuItems = subscribe('menu_items', ['menu-items']);
    
    // Subscribe to order_items table changes with a refetch callback
    const unsubscribeOrderItems = subscribe('order_items', ['order-quantities'], refetchOrderQuantities);
    
    // Subscribe to orders table changes with the same refetch callback
    const unsubscribeOrders = subscribe('orders', ['order-quantities'], refetchOrderQuantities);
    
    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeMenuItems();
      unsubscribeOrderItems();
      unsubscribeOrders();
    };
  }, [subscribe, refetchOrderQuantities]);
};
