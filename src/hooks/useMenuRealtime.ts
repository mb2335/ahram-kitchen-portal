
import { useMenuChannel } from './menu/useMenuChannel';
import { useOrderChannel } from './menu/useOrderChannel';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  // Use the centralized channel hooks
  useMenuChannel();
  useOrderChannel(refetchOrderQuantities);
};
