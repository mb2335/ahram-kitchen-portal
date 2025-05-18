
import { useRealtimeMenuUpdates } from './useRealtimeMenuUpdates';
import { useOrderChannel } from './menu/useOrderChannel';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  useRealtimeMenuUpdates();
  useOrderChannel(refetchOrderQuantities);
};
