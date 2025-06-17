
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

  // Fetch delivery settings - no vendor filter for consistency
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      try {
        // Get first available delivery settings for consistent experience
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('*')
          .limit(1);
          
        if (error || !data || data.length === 0) {
          console.error('Error or no data when fetching delivery settings:', error);
          return null;
        }
        
        console.log("Fetched delivery settings:", data[0]);
        return data[0] as DeliverySetting;
      } catch (err) {
        console.error("Exception fetching delivery settings:", err);
        return null;
      }
    },
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      // Only proceed if we have a valid selected date
      if (!selectedDate || dayOfWeek < 0) {
        setTimeSlots([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // First check if the selected day is even valid for delivery
        if (!settings || !settings.active_days || !settings.active_days.includes(dayOfWeek)) {
          setTimeSlots([]);
          if (dayOfWeek >= 0) {
            setError(`Delivery is not available on the selected day.`);
          }
          return;
        }
        
        // Then check if this day has any time slots configured
        const slots = settings.time_slots || [];
        
        if (slots.length === 0) {
          setError(`No delivery time slots have been configured for this day.`);
          setTimeSlots([]);
          return;
        }
        
        // Normalize time format for consistency (remove seconds)
        const normalizedSlots = slots.map(slot => {
          // Extract hours and minutes only
          const match = slot.match(/^(\d{1,2}):(\d{2})/);
          if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
          }
          return slot;
        });

        console.log("Available time slots from settings:", normalizedSlots);
        
        // Since delivery_time_bookings table doesn't exist, all slots are available
        const bookedTimes = new Set();
        
        console.log("Booked times:", Array.from(bookedTimes));
        
        // Create the final available time slots
        const availableSlots: TimeSlot[] = normalizedSlots.map(time => ({
          time,
          available: !bookedTimes.has(time)
        }));
        
        // Sort by time
        availableSlots.sort((a, b) => a.time.localeCompare(b.time));
        
        console.log("Final available slots:", availableSlots);
        setTimeSlots(availableSlots);
        
      } catch (err) {
        console.error('Error loading time slots:', err);
        setError('Failed to load delivery time slots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAvailableTimeSlots();
  }, [settings, categoryId, selectedDate, formattedDate, dayOfWeek]);

  return {
    timeSlots,
    isLoading: isLoading || isSettingsLoading,
    error
  };
}
