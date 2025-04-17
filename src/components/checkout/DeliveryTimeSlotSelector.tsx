
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTimeSlots } from '@/hooks/delivery/useTimeSlots';
import { TimeSlotGrid } from './delivery/TimeSlotGrid';

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
  const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { timeSlots, isLoading, error } = useTimeSlots({
    categoryId,
    dayOfWeek,
    formattedDate,
    selectedDate
  });

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
  
  if (!timeSlots || timeSlots.length === 0) {
    return (
      <Alert className="mt-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No delivery time slots have been set up for this category. Please contact the vendor.
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
      <TimeSlotGrid
        timeSlots={timeSlots}
        selectedTimeSlot={selectedTimeSlot}
        onTimeSlotChange={onTimeSlotChange}
      />
    </div>
  );
}
