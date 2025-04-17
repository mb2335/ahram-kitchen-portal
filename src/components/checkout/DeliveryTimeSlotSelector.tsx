
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { TimeSlot, formatTime } from '@/types/delivery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

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
  
  const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['delivery-schedule', categoryId, dayOfWeek],
    queryFn: async () => {
      if (dayOfWeek < 0) return null;
      
      const { data: scheduleData, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('category_id', categoryId)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return scheduleData as {
        id: string;
        category_id: string;
        day_of_week: number;
        active: boolean;
        created_at: string;
        activated_slots: string[];
      } | null;
    },
    enabled: dayOfWeek >= 0,
  });

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (!scheduleData) {
          setTimeSlots([]);
          onTimeSlotChange(null);
          if (dayOfWeek >= 0) {
            setError(`No delivery times available for ${categoryName} on this day.`);
          }
          return;
        }
        
        const slots = scheduleData.activated_slots || [];
        
        if (slots.length === 0) {
          setError(`No delivery time slots configured for ${categoryName} on this day.`);
          setTimeSlots([]);
          onTimeSlotChange(null);
          return;
        }
        
        const { data: bookingsData, error: bookingError } = await supabase
          .from('delivery_time_bookings')
          .select('time_slot')
          .eq('category_id', categoryId)
          .eq('delivery_date', formattedDate);
          
        if (bookingError) {
          throw bookingError;
        }
        
        const bookedTimes = new Set((bookingsData || []).map(booking => booking.time_slot));
        
        const availableSlots: TimeSlot[] = slots.map(time => ({
          time,
          available: !bookedTimes.has(time)
        }));
        
        // Sort slots by time
        availableSlots.sort((a, b) => a.time.localeCompare(b.time));
        
        setTimeSlots(availableSlots);
        
        // If the previously selected time slot is no longer available, clear the selection
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
    
    if (selectedDate && dayOfWeek >= 0) {
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
  
  if (isScheduleLoading || isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <Label className="mb-2 block">Select Delivery Time Slot</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
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
      <Label className="mb-2 block flex items-center gap-1">
        <Clock className="h-4 w-4" /> 
        Select Delivery Time Slot
      </Label>
      <ScrollArea className="max-h-64 border rounded-md">
        <RadioGroup
          value={selectedTimeSlot || ""}
          onValueChange={onTimeSlotChange}
          className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2"
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
      </ScrollArea>
    </div>
  );
}
