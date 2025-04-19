
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TimeSlot } from '@/types/delivery';

interface UseTimeSlotsProps {
  categoryId: string;
  dayOfWeek: number;
  formattedDate: string;
  selectedDate: Date | null;
}

interface DeliverySetting {
  id: string;
  vendor_id: string;
  active_days: number[];
  time_slots: string[];
  created_at: string | null;
  updated_at: string | null;
}

export function useTimeSlots({ 
  categoryId, 
  dayOfWeek, 
  formattedDate, 
  selectedDate 
}: UseTimeSlotsProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['vendor-delivery-settings', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', categoryId)
        .maybeSingle();

      if (error) throw error;
      return data as DeliverySetting | null;
    },
    enabled: !!categoryId,
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!settings || !settings.time_slots || !settings.active_days.includes(dayOfWeek)) {
          setTimeSlots([]);
          if (dayOfWeek >= 0) {
            setError(`No delivery time slots have been set up for this day.`);
          }
          return;
        }
        
        const slots = settings.time_slots;
        console.log("Time slots from database:", slots);
        
        if (slots.length === 0) {
          setError(`No delivery time slots have been configured for this day.`);
          setTimeSlots([]);
          return;
        }
        
        const { data: bookingsData, error: bookingError } = await supabase
          .from('delivery_time_bookings')
          .select('time_slot')
          .eq('category_id', categoryId)
          .eq('delivery_date', formattedDate);
          
        if (bookingError) {
          console.error("Error fetching bookings:", bookingError);
          throw bookingError;
        }
        
        const bookedTimes = new Set((bookingsData || []).map(booking => booking.time_slot));
        
        const availableSlots: TimeSlot[] = slots.map(time => ({
          time,
          available: !bookedTimes.has(time)
        }));
        
        availableSlots.sort((a, b) => a.time.localeCompare(b.time));
        console.log("Processed available slots:", availableSlots);
        setTimeSlots(availableSlots);
        
      } catch (err) {
        console.error('Error loading time slots:', err);
        setError('Failed to load delivery time slots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedDate && dayOfWeek >= 0) {
      loadAvailableTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [settings, categoryId, selectedDate, formattedDate, dayOfWeek]);

  return {
    timeSlots,
    isLoading: isLoading || isSettingsLoading,
    error
  };
}
