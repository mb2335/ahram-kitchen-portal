import { useRealtimeMenuUpdates } from './useRealtimeMenuUpdates';
import { useOrderChannel } from './menu/useOrderChannel';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  // Use the centralized real-time updates hook
  useRealtimeMenuUpdates();
  
  // Keep the order channel functionality separate
  useOrderChannel(refetchOrderQuantities);
};
