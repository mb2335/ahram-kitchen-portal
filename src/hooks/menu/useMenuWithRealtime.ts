
import { useMenuItems } from '../useMenuItems';
import { useOrderQuantities } from '../useOrderQuantities';
import { useMenuChannel } from './useMenuChannel';
import { useOrderChannel } from './useOrderChannel';

export function useMenuWithRealtime() {
  const menuItemsQuery = useMenuItems();
  const orderQuantitiesQuery = useOrderQuantities();

  // Use the centralized channel hooks for realtime updates
  useMenuChannel();
  useOrderChannel(orderQuantitiesQuery.refetch);

  return {
    menuItems: menuItemsQuery.data || [],
    isLoading: menuItemsQuery.isLoading,
    error: menuItemsQuery.error,
    orderQuantities: orderQuantitiesQuery.data || {},
    refetchOrderQuantities: orderQuantitiesQuery.refetch,
  };
}
