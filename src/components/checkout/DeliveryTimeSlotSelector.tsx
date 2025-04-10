
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { TimeSlot, formatTime, generateTimeSlots } from '@/types/delivery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryTimeSlotSelectorProps {
  categoryId: string;
  categoryName: string;
  selectedDate: Date;
  selectedTimeSlot: string | null;
  onTimeSlotChange: (timeSlot: string | null) => void;
}

export function DeliveryTimeSlotSelector({
  categoryId,
  categoryName,
  selectedDate,
  selectedTimeSlot,
  onTimeSlotChange
}: DeliveryTimeSlotSelectorProps) {
  const { t } = useLanguage();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the day of week (0-6) for the selected date
  const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Query for the delivery schedule
  const { data: scheduleData } = useQuery({
    queryKey: ['delivery-schedule', categoryId, dayOfWeek],
    queryFn: async () => {
      if (dayOfWeek < 0) return null;
      
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('category_id', categoryId)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      return data as {
        id: string;
        category_id: string;
        day_of_week: number;
        time_interval: number;
        start_time: string;
        end_time: string;
        active: boolean;
        created_at: string;
      } | null;
    },
    enabled: dayOfWeek >= 0,
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Clear time slots if no schedule is available for this day
        if (!scheduleData) {
          setTimeSlots([]);
          onTimeSlotChange(null);
          if (dayOfWeek >= 0) {
            setError(`No delivery times available for ${categoryName} on this day.`);
          }
          return;
        }
        
        // Generate time slots based on schedule
        const slots = generateTimeSlots(
          scheduleData.start_time,
          scheduleData.end_time,
          scheduleData.time_interval
        );
        
        // Check which slots are already booked
        const { data: bookings } = await supabase
          .from('delivery_time_bookings')
          .select('time_slot')
          .eq('category_id', categoryId)
          .eq('delivery_date', formattedDate);
        
        // Mark booked slots as unavailable
        const bookedTimes = new Set((bookings || []).map(booking => booking.time_slot));
        
        const availableSlots: TimeSlot[] = slots.map(time => ({
          time,
          available: !bookedTimes.has(time)
        }));
        
        setTimeSlots(availableSlots);
        
        // If the previously selected slot is no longer available, clear it
        if (selectedTimeSlot && !availableSlots.find(slot => slot.time === selectedTimeSlot && slot.available)) {
          onTimeSlotChange(null);
        }
        
      } catch (err) {
        console.error('Error loading time slots:', err);
        setError('Failed to load delivery time slots. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedDate) {
      loadAvailableTimeSlots();
    } else {
      setTimeSlots([]);
      onTimeSlotChange(null);
    }
  }, [scheduleData, categoryId, selectedDate, formattedDate, dayOfWeek, onTimeSlotChange, selectedTimeSlot, categoryName]);

  if (!selectedDate) {
    return (
      <Alert className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select a delivery date first.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isLoading) {
    return <div className="text-sm mt-2">Loading available time slots...</div>;
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (timeSlots.length === 0) {
    return (
      <Alert className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No delivery time slots available for this date.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4">
      <Label className="mb-2 block">Select Delivery Time Slot</Label>
      <RadioGroup
        value={selectedTimeSlot || ""}
        onValueChange={onTimeSlotChange}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
      >
        {timeSlots.map((slot) => (
          <div key={slot.time} className="relative">
            <RadioGroupItem
              value={slot.time}
              id={`time-${slot.time}`}
              disabled={!slot.available}
              className="peer sr-only"
            />
            <Label
              htmlFor={`time-${slot.time}`}
              className={`flex h-10 w-full items-center justify-center rounded-md border border-muted text-center text-sm transition-colors 
                ${slot.available ? 
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted/50' : 
                  'opacity-50 cursor-not-allowed bg-muted/20 line-through'
                }`}
            >
              {formatTime(slot.time)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
