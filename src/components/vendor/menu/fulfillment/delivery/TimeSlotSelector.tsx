
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { useEffect, useState } from "react";

interface TimeSlotSelectorProps {
  timeSlots: string[];
  activatedSlots: string[];
  onTimeSlotToggle: (slot: string) => void;
  isSaving: boolean;
}

export function TimeSlotSelector({ 
  timeSlots, 
  activatedSlots, 
  onTimeSlotToggle, 
  isSaving 
}: TimeSlotSelectorProps) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  
  // Initialize selected slots from activatedSlots when component mounts
  // or when activatedSlots changes
  useEffect(() => {
    console.log("Activated slots updated in TimeSlotSelector:", activatedSlots);
    setSelectedSlots(activatedSlots);
  }, [activatedSlots]);

  const isTimeSlotActivated = (timeSlot: string): boolean => {
    return selectedSlots.includes(timeSlot);
  };

  const handleTimeSlotToggle = (slot: string) => {
    // Update local state first for immediate UI feedback
    setSelectedSlots(prev => 
      prev.includes(slot)
        ? prev.filter(s => s !== slot)
        : [...prev, slot]
    );
    
    // Then call the parent handler
    onTimeSlotToggle(slot);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Available Time Slots</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select the time slots available for delivery on selected days.
        </p>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {timeSlots.map((slot) => (
          <Button
            key={slot}
            variant={isTimeSlotActivated(slot) ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => handleTimeSlotToggle(slot)}
            disabled={isSaving}
          >
            {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
          </Button>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        {selectedSlots.length} time slots selected
      </p>
    </div>
  );
}
