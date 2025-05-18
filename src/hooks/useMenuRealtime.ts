
import { useMenuChannel } from './menu/useMenuChannel';
import { useOrderChannel } from './menu/useOrderChannel';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  useMenuChannel();
  useOrderChannel(refetchOrderQuantities);
};
