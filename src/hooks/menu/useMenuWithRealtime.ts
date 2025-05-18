
import { useMenuItems } from '../useMenuItems';
import { useOrderQuantities } from '../useOrderQuantities';
import { useMenuRealtime } from '../useMenuRealtime';

export function useMenuWithRealtime() {
  const menuItemsQuery = useMenuItems();
  const orderQuantitiesQuery = useOrderQuantities();

  // Use our centralized realtime hook instead of duplicating the logic
  useMenuRealtime(orderQuantitiesQuery.refetch);

  return {
    menuItems: menuItemsQuery.data || [],
    isLoading: menuItemsQuery.isLoading,
    error: menuItemsQuery.error,
    orderQuantities: orderQuantitiesQuery.data || {},
    refetchOrderQuantities: orderQuantitiesQuery.refetch,
  };
}
