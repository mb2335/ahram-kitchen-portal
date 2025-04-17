
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
  const [timeSlots, setTimeSlots] = useState<{ time: string; isActivated: boolean; isBooked: boolean }[]>([]);

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
    queryKey: ['delivery-bookings', categoryId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_time_bookings')
        .select('time_slot')
        .eq('category_id', categoryId)
        .eq('delivery_date', format(selectedDate, 'yyyy-MM-dd'));

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const slots: { time: string; isActivated: boolean; isBooked: boolean }[] = [];
    const startHour = 9;
    const endHour = 18;
    
    // Generate fixed 30-minute slots from 9 AM to 6 PM
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isActivated = scheduleData?.activated_slots?.includes(timeString) || false;
        const isBooked = bookingsData?.some(booking => booking.time_slot === timeString) || false;
        
        slots.push({ 
          time: timeString, 
          isActivated,
          isBooked
        });
      }
    }

    setTimeSlots(slots);
  }, [scheduleData, bookingsData]);

  const handleSlotToggle = async (time: string) => {
    try {
      const { data: existingSchedule } = await supabase
        .from('delivery_schedules')
        .select('activated_slots')
        .eq('category_id', categoryId)
        .eq('day_of_week', dayOfWeek)
        .single();

      let newActivatedSlots: string[];
      
      if (existingSchedule) {
        const currentSlots = existingSchedule.activated_slots || [];
        newActivatedSlots = currentSlots.includes(time)
          ? currentSlots.filter(slot => slot !== time)
          : [...currentSlots, time];

        await supabase
          .from('delivery_schedules')
          .update({ activated_slots: newActivatedSlots })
          .eq('category_id', categoryId)
          .eq('day_of_week', dayOfWeek);
      } else {
        newActivatedSlots = [time];
        await supabase
          .from('delivery_schedules')
          .insert({
            category_id: categoryId,
            day_of_week: dayOfWeek,
            active: true,
            activated_slots: newActivatedSlots
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
          {timeSlots.map(({ time, isActivated, isBooked }) => (
            <Button
              key={time}
              variant={isActivated ? (isBooked ? "secondary" : "default") : "outline"}
              className={`w-full ${isBooked ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isBooked && handleSlotToggle(time)}
              disabled={isBooked}
            >
              {formatDisplayTime(time)}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
