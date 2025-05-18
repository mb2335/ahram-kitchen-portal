
import { useRealtimeMenuUpdates } from './menu/useRealtimeMenuUpdates';

export const useMenuRealtime = (refetchOrderQuantities?: () => void) => {
  const { refetch } = useRealtimeMenuUpdates();
  
  // If refetchOrderQuantities is provided, we can call it when needed
  if (refetchOrderQuantities) {
    refetchOrderQuantities();
  }
  
  return { refetch };
};
