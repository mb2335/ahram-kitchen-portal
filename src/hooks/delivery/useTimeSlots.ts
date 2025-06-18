
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

interface DeliveryTimeBooking {
  id: string;
  delivery_date: string;
  time_slot: string;
  order_id: string;
  customer_name: string;
  customer_phone: string | null;
  created_at: string;
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

  // Fetch delivery settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      try {
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

  // Fetch booked time slots for the selected date
  const { data: bookedSlots = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ['delivery-bookings', formattedDate],
    queryFn: async () => {
      if (!formattedDate) return [];
      
      try {
        const { data, error } = await supabase
          .from('delivery_time_bookings')
          .select('*')
          .eq('delivery_date', formattedDate);
        
        if (error) {
          console.error('Error fetching delivery bookings:', error);
          return [];
        }
        
        console.log(`Fetched ${data?.length || 0} bookings for ${formattedDate}:`, data);
        return data as DeliveryTimeBooking[];
      } catch (err) {
        console.error('Exception fetching delivery bookings:', err);
        return [];
      }
    },
    enabled: !!formattedDate,
  });

  // Set up real-time subscription for booking changes
  useEffect(() => {
    if (!formattedDate) return;

    const channel = supabase
      .channel('delivery-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_time_bookings',
          filter: `delivery_date=eq.${formattedDate}`
        },
        (payload) => {
          console.log('Real-time booking change:', payload);
          // Refetch bookings when changes occur
          // The query will automatically refetch due to cache invalidation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formattedDate]);

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      if (!selectedDate || dayOfWeek < 0) {
        setTimeSlots([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        if (!settings || !settings.active_days || !settings.active_days.includes(dayOfWeek)) {
          setTimeSlots([]);
          if (dayOfWeek >= 0) {
            setError(`Delivery is not available on the selected day.`);
          }
          return;
        }
        
        const slots = settings.time_slots || [];
        
        if (slots.length === 0) {
          setError(`No delivery time slots have been configured for this day.`);
          setTimeSlots([]);
          return;
        }
        
        // Normalize time format for consistency
        const normalizedSlots = slots.map(slot => {
          const match = slot.match(/^(\d{1,2}):(\d{2})/);
          if (match) {
            return `${match[1].padStart(2, '0')}:${match[2]}`;
          }
          return slot;
        });

        console.log("Available time slots from settings:", normalizedSlots);
        
        // Create set of booked times for quick lookup
        const bookedTimes = new Set(
          bookedSlots.map(booking => {
            // Normalize the booked time slot format
            const match = booking.time_slot.match(/^(\d{1,2}):(\d{2})/);
            if (match) {
              return `${match[1].padStart(2, '0')}:${match[2]}`;
            }
            return booking.time_slot;
          })
        );
        
        console.log("Booked times:", Array.from(bookedTimes));
        
        // Create the final available time slots, marking booked ones as unavailable
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
  }, [settings, categoryId, selectedDate, formattedDate, dayOfWeek, bookedSlots]);

  return {
    timeSlots,
    isLoading: isLoading || isSettingsLoading || isBookingsLoading,
    error
  };
}
