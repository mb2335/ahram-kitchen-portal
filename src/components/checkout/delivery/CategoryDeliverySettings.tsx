
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { TimeSlotSelector } from './TimeSlotSelector';
import { DeliveryTimeSlotSelection } from '@/types/delivery';
import { useTimeSlots } from '@/hooks/delivery/useTimeSlots';

interface CategoryDeliverySettingsProps {
  categoryId: string;
  categoryName: string;
  selectedDate: Date;
  onTimeSlotSelectionChange: (selection: DeliveryTimeSlotSelection) => void;
}

export function CategoryDeliverySettings({
  categoryId,
  categoryName,
  selectedDate,
  onTimeSlotSelectionChange
}: CategoryDeliverySettingsProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { timeSlots, isLoading, error } = useTimeSlots({
    categoryId,
    dayOfWeek,
    formattedDate,
    selectedDate
  });

  useEffect(() => {
    const timeSlotId = `timeSlot_${categoryId}`;
    try {
      const savedData = window.localStorage?.getItem(timeSlotId);
      if (savedData) {
        const { timeSlot, date } = JSON.parse(savedData);
        if (date === format(selectedDate, 'yyyy-MM-dd')) {
          setSelectedTimeSlot(timeSlot);
          onTimeSlotSelectionChange({
            categoryId,
            date: selectedDate,
            timeSlot
          });
        }
      }
    } catch (error) {
      console.error('Error retrieving time slot from localStorage:', error);
    }
  }, [categoryId, selectedDate, onTimeSlotSelectionChange]);

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
    onTimeSlotSelectionChange({
      categoryId,
      date: selectedDate,
      timeSlot
    });
  };

  if (isLoading || error || !timeSlots) {
    return null;
  }

  const availableTimeSlotStrings = timeSlots.map(slot => slot.time);

  return (
    <div className="space-y-3">
      <TimeSlotSelector
        categoryId={categoryId}
        categoryName={categoryName}
        selectedDate={selectedDate}
        availableTimeSlots={availableTimeSlotStrings}
        selectedTimeSlot={selectedTimeSlot}
        onTimeSlotSelect={handleTimeSlotSelect}
      />
    </div>
  );
}
