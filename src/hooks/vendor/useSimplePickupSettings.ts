import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVendorId } from '@/hooks/useVendorId';

export interface TimeSlot {
  id?: string;
  start_time: string;
  end_time: string;
  max_capacity?: number;
}

export interface DaySchedule {
  day: number;
  is_active: boolean;
  time_slots: TimeSlot[];
}

export const useSimplePickupSettings = () => {
  const { vendorId } = useVendorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['simple-pickup-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      // Return empty array as we're now using the new pickup settings approach
      return [];
    },
    enabled: !!vendorId,
  });

  const saveSchedule = useMutation({
    mutationFn: async (schedule: DaySchedule) => {
      // This is a legacy function, keeping for compatibility
      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-pickup-settings'] });
      toast({
        title: "Success",
        description: "Pickup schedule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pickup schedule",
        variant: "destructive",
      });
    },
  });

  return {
    schedules,
    isLoading,
    saveSchedule,
  };
};
