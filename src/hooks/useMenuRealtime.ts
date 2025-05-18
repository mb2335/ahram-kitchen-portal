
import { useMenuRealtimeContext } from '@/contexts/MenuRealtimeContext';

export const useMenuRealtime = (refetchOrderQuantities: () => void) => {
  // Just use the centralized context, no need to set up separate channels
  return useMenuRealtimeContext();
};
