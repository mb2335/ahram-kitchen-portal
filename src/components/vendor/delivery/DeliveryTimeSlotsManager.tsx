
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DeliveryTimeSlotsManagerProps {
  categoryId: string;
  selectedDate: Date;
  dayOfWeek: number;
}

export function DeliveryTimeSlotsManager({ 
  categoryId, 
  selectedDate, 
  dayOfWeek 
}: DeliveryTimeSlotsManagerProps) {
  const [timeSlots, setTimeSlots] = useState<{ time: string; isBooked: boolean }[]>([]);
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');

  // Fetch schedule and bookings
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['delivery-schedule', categoryId, dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('category_id', categoryId)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
  });

  const { data: bookingsData, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['delivery-bookings', categoryId, formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_time_bookings')
        .select('time_slot')
        .eq('category_id', categoryId)
        .eq('delivery_date', formattedDate);

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!scheduleData) return;

    const interval = scheduleData.time_interval || 30;
    const startTime = new Date(`1970-01-01T${scheduleData.start_time}`);
    const endTime = new Date(`1970-01-01T${scheduleData.end_time}`);
    const slots: { time: string; isBooked: boolean }[] = [];

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');
      const isBooked = bookingsData?.some(
        booking => booking.time_slot === timeString
      ) || false;

      slots.push({ 
        time: timeString, 
        isBooked 
      });

      currentTime = new Date(currentTime.getTime() + interval * 60000);
    }

    setTimeSlots(slots);
  }, [scheduleData, bookingsData]);

  const handleSlotToggle = async (time: string) => {
    try {
      const { data: existingBooking } = await supabase
        .from('delivery_time_bookings')
        .select('id')
        .eq('category_id', categoryId)
        .eq('delivery_date', formattedDate)
        .eq('time_slot', time)
        .single();

      if (existingBooking) {
        // Remove booking if it exists
        await supabase
          .from('delivery_time_bookings')
          .delete()
          .eq('id', existingBooking.id);
      } else {
        // Create new booking
        await supabase
          .from('delivery_time_bookings')
          .insert({
            category_id: categoryId,
            delivery_date: formattedDate,
            time_slot: time
          });
      }
    } catch (error) {
      console.error('Error toggling time slot:', error);
    }
  };

  if (isScheduleLoading || isBookingsLoading) {
    return (
      <div className="space-y-4">
        <Label className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Time Slots
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No delivery schedule configured for this day.
        </AlertDescription>
      </Alert>
    );
  }

  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        Time Slots
      </Label>
      <ScrollArea className="h-[320px] border rounded-md p-4">
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map(({ time, isBooked }) => (
            <Button
              key={time}
              variant={isBooked ? "secondary" : "outline"}
              className="w-full"
              onClick={() => handleSlotToggle(time)}
            >
              {formatDisplayTime(time)}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
