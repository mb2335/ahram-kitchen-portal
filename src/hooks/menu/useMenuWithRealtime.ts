
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMenuItems } from '../useMenuItems';
import { useOrderQuantities } from '../useOrderQuantities';
import { useMenuRealtimeContext } from '@/contexts/MenuRealtimeContext';

export function useMenuWithRealtime() {
  const queryClient = useQueryClient();
  const menuItemsQuery = useMenuItems();
  const orderQuantitiesQuery = useOrderQuantities();
  
  // Use the centralized context rather than setting up new subscriptions
  useMenuRealtimeContext();

  return {
    menuItems: menuItemsQuery.data || [],
    isLoading: menuItemsQuery.isLoading,
    error: menuItemsQuery.error,
    orderQuantities: orderQuantitiesQuery.data || {},
    refetchOrderQuantities: orderQuantitiesQuery.refetch,
  };
}
