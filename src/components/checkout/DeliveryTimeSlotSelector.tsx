import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTimeSlots } from '@/hooks/delivery/useTimeSlots';
import { TimeSlotGrid } from './delivery/TimeSlotGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DeliveryTimeSlotSelectorProps {
  categoryId: string;
  categoryName: string;
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  onTimeSlotChange?: (timeSlot: string) => void;
}

export function DeliveryTimeSlotSelector({
  categoryId,
  categoryName,
  selectedDate,
  selectedTimeSlot,
  onTimeSlotChange
}: DeliveryTimeSlotSelectorProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(-1);
  
  useEffect(() => {
    if (selectedDate) {
      setFormattedDate(format(selectedDate, 'yyyy-MM-dd'));
      setDayOfWeek(selectedDate.getDay());
    } else {
      setFormattedDate('');
      setDayOfWeek(-1);
    }
  }, [selectedDate]);

  const { timeSlots, isLoading, error } = useTimeSlots({
    categoryId: 'global',
    dayOfWeek,
    formattedDate,
    selectedDate
  });

  const handleTimeSlotChange = (timeSlot: string) => {
    if (onTimeSlotChange) {
      onTimeSlotChange(timeSlot);
    }
  };

  if (!selectedDate) {
    return null;
  }

  if (isLoading) {
    return <div className="text-sm">Loading available time slots...</div>;
  }

  if (error) {
    return (
      <Alert variant="default" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const availableTimeSlots = timeSlots.filter(slot => slot.available);

  if (availableTimeSlots.length === 0) {
    return (
      <Alert variant="default" className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No delivery time slots are available for this date. Please select another date or choose pickup instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TimeSlotGrid 
      timeSlots={timeSlots} 
      selectedTimeSlot={selectedTimeSlot} 
      onTimeSlotChange={handleTimeSlotChange} 
    />
  );
}
