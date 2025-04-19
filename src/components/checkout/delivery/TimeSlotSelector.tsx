
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { formatTime } from '@/types/delivery';

interface TimeSlotSelectorProps {
  categoryId: string;
  categoryName: string;
  selectedDate: Date | null;
  availableTimeSlots: string[];
  selectedTimeSlot: string | null;
  onTimeSlotSelect: (timeSlot: string) => void;
}

export function TimeSlotSelector({
  categoryId,
  categoryName,
  selectedDate,
  availableTimeSlots,
  selectedTimeSlot,
  onTimeSlotSelect
}: TimeSlotSelectorProps) {
  const [localSelectedTimeSlot, setLocalSelectedTimeSlot] = useState<string | null>(selectedTimeSlot);

  // Ensure local state stays in sync with prop
  useEffect(() => {
    setLocalSelectedTimeSlot(selectedTimeSlot);
  }, [selectedTimeSlot]);

  if (!selectedDate || !availableTimeSlots.length) {
    return null;
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    // Store selection in localStorage to persist through page reloads
    const timeSlotId = `timeSlot_${categoryId}`;
    try {
      window.localStorage?.setItem(
        timeSlotId,
        JSON.stringify({
          timeSlot,
          date: format(selectedDate, 'yyyy-MM-dd')
        })
      );
    } catch (error) {
      console.error('Error saving time slot to localStorage:', error);
    }

    setLocalSelectedTimeSlot(timeSlot);
    onTimeSlotSelect(timeSlot);
  };

  // Format the date for display
  const formattedDate = format(selectedDate, 'EEEE, MMM d');

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4" />
        <h4 className="font-medium">Select a delivery time for {categoryName}</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Delivery date: {formattedDate}
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableTimeSlots.map((timeSlot) => (
          <Button
            key={`${categoryId}-${timeSlot}`}
            variant={localSelectedTimeSlot === timeSlot ? "default" : "outline"}
            size="sm"
            className={cn(
              "justify-center text-center",
              localSelectedTimeSlot === timeSlot
                ? "bg-primary"
                : "border border-gray-200 hover:bg-gray-100"
            )}
            onClick={() => handleTimeSlotSelect(timeSlot)}
          >
            {formatTime(timeSlot)}
          </Button>
        ))}

        {availableTimeSlots.length === 0 && (
          <p className="col-span-full text-sm text-orange-600">
            No time slots available for this date.
          </p>
        )}
      </div>
    </div>
  );
}
