
import { useRealtime } from '@/contexts/RealtimeContext';
import { useEffect } from 'react';

export const useMenuChannel = () => {
  const { subscribe } = useRealtime();

  useEffect(() => {
    // Subscribe to menu_items changes
    const unsubscribe = subscribe('menu_items', ['menu-items']);
    
    // Clean up subscription when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [subscribe]);
};
