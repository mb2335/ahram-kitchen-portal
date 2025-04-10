
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from '@/integrations/supabase/client';
import { TimeSlot } from '@/types/delivery';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DeliveryTimeSlotSelectorProps {
  selectedDate: Date | null;
  categoryId?: string;
  selectedTimeSlot: string | null;
  onTimeSlotChange: (timeSlotId: string | null) => void;
}

export function DeliveryTimeSlotSelector({
  selectedDate,
  categoryId,
  selectedTimeSlot,
  onTimeSlotChange
}: DeliveryTimeSlotSelectorProps) {
  const { t } = useLanguage();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }
    
    const fetchTimeSlots = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dayOfWeek = selectedDate.getDay();
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // First check for date-specific slots
        let query = supabase
          .from('delivery_schedules')
          .select('*') as any;
          
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        } else {
          query = query.is('category_id', null);
        }
        
        // Get the weekly schedule for this day
        const { data: schedules, error } = await query
          .eq('day_of_week', dayOfWeek)
          .eq('active', true);
          
        if (error) throw error;
        
        if (!schedules || schedules.length === 0) {
          setAvailableSlots([]);
          return;
        }
        
        // Get all bookings for this date to filter out already booked slots
        const { data: bookings, error: bookingsError } = await supabase
          .from('delivery_time_bookings')
          .select('time_slot_id') as any;
          
        if (bookingsError) throw bookingsError;
        
        const bookedSlotIds = new Set((bookings || []).map((b: any) => b.time_slot_id));
        
        // Filter out unavailable and booked slots
        const slots = schedules.flatMap((schedule: any) => 
          schedule.time_slots.filter((slot: TimeSlot) => 
            slot.available && !bookedSlotIds.has(slot.id)
          )
        );
        
        setAvailableSlots(slots);
      } catch (err: any) {
        console.error('Error fetching time slots:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [selectedDate, categoryId]);
  
  if (!selectedDate) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checkout.delivery.timeSlot')}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : availableSlots.length > 0 ? (
          <RadioGroup 
            value={selectedTimeSlot || ''} 
            onValueChange={onTimeSlotChange}
            className="space-y-2"
          >
            {availableSlots.map((slot) => (
              <div key={slot.id} className="flex items-center space-x-2 border p-3 rounded-md">
                <RadioGroupItem value={slot.id} id={`slot-${slot.id}`} />
                <Label htmlFor={`slot-${slot.id}`} className="flex-grow">
                  {slot.start_time} - {slot.end_time}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Alert variant="default" className="bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('checkout.delivery.noTimeSlots')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
