
import { useMenuChannel } from './menu/useMenuChannel';
import { useOrderChannel } from './menu/useOrderChannel';
import { usePickupChannel } from './menu/usePickupChannel'; 

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  // Setup realtime subscriptions for menu, order and pickup updates
  useMenuChannel();
  useOrderChannel(refetchOrderQuantities);
  usePickupChannel(); // Listen for pickup settings changes
};
