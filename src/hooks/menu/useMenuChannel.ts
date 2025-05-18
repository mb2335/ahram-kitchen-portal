
import { useMenuRealtimeContext } from '@/contexts/MenuRealtimeContext';

export const useMenuChannel = () => {
  // This is now just a wrapper around our centralized context
  // for backward compatibility
  return useMenuRealtimeContext();
};
