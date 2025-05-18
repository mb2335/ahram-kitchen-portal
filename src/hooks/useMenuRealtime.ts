
import { useRealtimeMenuUpdates } from './menu/useRealtimeMenuUpdates';

export const useMenuRealtime = () => {
  // Use our new centralized hook for all menu realtime updates
  useRealtimeMenuUpdates();
};
