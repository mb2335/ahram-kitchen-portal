
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

  // Modified query to work with guest users - fetching the first available settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      // Fetch any delivery settings without filtering by vendor_id
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching delivery settings:', error);
        // Try to get any settings as a fallback
        const fallbackQuery = await supabase
          .from('delivery_settings')
          .select('*')
          .limit(1);
          
        if (fallbackQuery.error) {
          console.error('Error fetching delivery settings (fallback):', fallbackQuery.error);
          throw error;
        }
        
        return fallbackQuery.data?.[0] as DeliverySetting || null;
      }
      
      console.log("Fetched delivery settings:", data);
      return data as DeliverySetting | null;
    },
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
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
        
        // Then check which slots are already booked
        const { data: bookingsData, error: bookingError } = await supabase
          .from('delivery_time_bookings')
          .select('time_slot')
          .eq('delivery_date', formattedDate);
          
        if (bookingError) {
          console.error("Error fetching bookings:", bookingError);
          throw bookingError;
        }
        
        // Create a set of booked times for faster lookups
        const bookedTimes = new Set();
        if (bookingsData) {
          bookingsData.forEach(booking => {
            // Normalize each booked time as well
            const match = booking.time_slot.match(/^(\d{1,2}):(\d{2})/);
            if (match) {
              bookedTimes.add(`${match[1].padStart(2, '0')}:${match[2]}`);
            } else {
              bookedTimes.add(booking.time_slot);
            }
          });
        }
        
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
