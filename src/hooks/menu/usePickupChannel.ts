
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePickupChannel = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Listen for changes to pickup_settings table
    const channel = supabase
      .channel('pickup-settings-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pickup_settings' 
        },
        () => {
          // Invalidate any queries that depend on pickup settings
          queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
        }
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
