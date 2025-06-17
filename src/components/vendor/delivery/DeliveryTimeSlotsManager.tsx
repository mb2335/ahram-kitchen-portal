
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

interface DeliverySetting {
  id: string;
  vendor_id: string;
  active_days: number[];
  time_slots: string[];
  created_at?: string;
  updated_at?: string;
}

export function DeliveryTimeSlotsManager({ 
  categoryId, 
  selectedDate, 
  dayOfWeek 
}: DeliveryTimeSlotsManagerProps) {
  const [timeSlots, setTimeSlots] = useState<{ time: string; isActivated: boolean; isBooked: boolean }[]>([]);

  // Fetch vendor delivery settings
  const { data: vendorSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['vendor-delivery-settings', categoryId, dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', categoryId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as DeliverySetting | null;
    },
  });

  // Mock bookings data since delivery_time_bookings table doesn't exist
  const bookingsData: any[] = [];
  const isBookingsLoading = false;

  useEffect(() => {
    const slots: { time: string; isActivated: boolean; isBooked: boolean }[] = [];
    const startHour = 9;
    const endHour = 18;
    
    // Check if this day is in the active days and the vendor has time slots
    const isDayActive = vendorSettings?.active_days?.includes(dayOfWeek) || false;
    const availableTimeSlots = vendorSettings?.time_slots || [];
    
    // Generate fixed 30-minute slots from 9 AM to 6 PM
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isActivated = isDayActive && availableTimeSlots.includes(timeString);
        const isBooked = false; // No bookings since table doesn't exist
        
        slots.push({ 
          time: timeString, 
          isActivated,
          isBooked
        });
      }
    }

    setTimeSlots(slots);
  }, [vendorSettings, bookingsData, dayOfWeek]);

  const handleSlotToggle = async (time: string) => {
    try {
      // Get current vendor settings
      const { data: currentSettings } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', categoryId)
        .maybeSingle();
      
      let newActiveDays = currentSettings?.active_days || [];
      let newTimeSlots = currentSettings?.time_slots || [];
      
      // Make sure this day is in the active days
      if (!newActiveDays.includes(dayOfWeek)) {
        newActiveDays = [...newActiveDays, dayOfWeek].sort();
      }
      
      // Toggle the time slot
      newTimeSlots = newTimeSlots.includes(time)
        ? newTimeSlots.filter(slot => slot !== time)
        : [...newTimeSlots, time].sort();
      
      // Update vendor delivery settings
      await supabase
        .from('delivery_settings')
        .upsert({
          vendor_id: categoryId,
          active_days: newActiveDays,
          time_slots: newTimeSlots,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'vendor_id'
        });
    } catch (error) {
      console.error('Error toggling time slot:', error);
    }
  };

  if (isSettingsLoading || isBookingsLoading) {
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
