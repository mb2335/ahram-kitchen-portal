
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
      
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('day', { ascending: true });
      
      if (error) throw error;

      // Group pickup settings by day
      const schedulesByDay: Record<number, DaySchedule> = {};
      
      (data || []).forEach(setting => {
        if (!schedulesByDay[setting.day]) {
          schedulesByDay[setting.day] = {
            day: setting.day,
            is_active: true, // If there are settings, the day is active
            time_slots: []
          };
        }
        
        if (setting.start_time && setting.end_time) {
          schedulesByDay[setting.day].time_slots.push({
            id: setting.id,
            start_time: setting.start_time,
            end_time: setting.end_time,
            max_capacity: 10 // Default capacity
          });
        }
      });

      return Object.values(schedulesByDay);
    },
    enabled: !!vendorId,
  });

  const saveSchedule = useMutation({
    mutationFn: async (schedule: DaySchedule) => {
      if (!vendorId) throw new Error('Vendor ID required');
      
      // Delete existing settings for this day
      await supabase
        .from('pickup_settings')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('day', schedule.day);

      // Insert new settings only if day is active and has time slots
      if (schedule.is_active && schedule.time_slots.length > 0) {
        const settingsToInsert = schedule.time_slots.map(slot => ({
          vendor_id: vendorId,
          day: schedule.day,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time: slot.start_time, // For backward compatibility
        }));

        const { error } = await supabase
          .from('pickup_settings')
          .insert(settingsToInsert);
        
        if (error) throw error;
      }

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
