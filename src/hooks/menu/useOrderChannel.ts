
import { useRealtime } from '@/contexts/RealtimeContext';
import { useEffect } from 'react';

export const useOrderChannel = (refetchOrderQuantities: () => void) => {
  const { subscribe } = useRealtime();
  
  useEffect(() => {
    // Subscribe to order_items with callback
    const unsubscribeOrderItems = subscribe('order_items', ['order-quantities'], refetchOrderQuantities);
    
    // Subscribe to orders with the same callback
    const unsubscribeOrders = subscribe('orders', ['order-quantities'], refetchOrderQuantities);
    
    // Clean up when component unmounts
    return () => {
      unsubscribeOrderItems();
      unsubscribeOrders();
    };
  }, [subscribe, refetchOrderQuantities]);
};
