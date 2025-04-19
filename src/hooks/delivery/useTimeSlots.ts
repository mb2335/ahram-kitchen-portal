
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

interface DeliverySettingData {
  id: string;
  vendor_id: string | null;
  day_of_week: number;
  active: boolean;
  activated_slots: string[] | null;
  created_at: string | null;
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

  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['delivery-settings', categoryId, dayOfWeek],
    queryFn: async () => {
      if (dayOfWeek < 0) return null;
      
      try {
        const { data: categorySettings, error: categoryError } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('vendor_id', categoryId)
          .eq('day_of_week', dayOfWeek)
          .eq('active', true)
          .single();
          
        if (categoryError && categoryError.code !== 'PGRST116') throw categoryError;
        
        if (categorySettings) {
          console.log("Found settings:", categorySettings);
          return categorySettings as DeliverySettingData;
        }
        
        return null;
      } catch (err) {
        console.error("Error in queryFn:", err);
        throw err;
      }
    },
    enabled: dayOfWeek >= 0,
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!scheduleData || !scheduleData.activated_slots || !Array.isArray(scheduleData.activated_slots)) {
          setTimeSlots([]);
          if (dayOfWeek >= 0) {
            setError(`No delivery time slots have been set up for this day.`);
          }
          return;
        }
        
        const slots = scheduleData.activated_slots;
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
  }, [scheduleData, categoryId, selectedDate, formattedDate, dayOfWeek]);

  return {
    timeSlots,
    isLoading: isLoading || isScheduleLoading,
    error
  };
}
