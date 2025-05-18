
import { useMenuChannel } from './menu/useMenuChannel';
import { useOrderChannel } from './menu/useOrderChannel';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  // Setup realtime subscriptions for menu and order updates
  useMenuChannel();
  useOrderChannel(refetchOrderQuantities);
};
