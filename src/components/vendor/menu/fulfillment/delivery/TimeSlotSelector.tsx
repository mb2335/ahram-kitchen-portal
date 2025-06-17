
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { useEffect, useState } from "react";

interface TimeSlotSelectorProps {
  timeSlots: string[];
  activatedSlots: string[];
  onTimeSlotToggle: (slot: string) => void;
  isSaving: boolean;
}

// Helper function to normalize time format (HH:MM)
const normalizeTimeFormat = (timeStr: string): string => {
  // Extract hours and minutes, ignoring seconds if present
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return timeStr; // Return original if not matching expected format
  
  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  
  return `${hours}:${minutes}`;
};

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
    // Normalize incoming activated slots for consistent comparison
    const normalizedActivatedSlots = activatedSlots.map(normalizeTimeFormat);
    setSelectedSlots(normalizedActivatedSlots);
  }, [activatedSlots]);

  const isTimeSlotActivated = (timeSlot: string): boolean => {
    // Normalize the time slot for consistent comparison
    const normalizedTimeSlot = normalizeTimeFormat(timeSlot);
    return selectedSlots.includes(normalizedTimeSlot);
  };

  const handleTimeSlotToggle = (slot: string) => {
    // Normalize the time slot
    const normalizedSlot = normalizeTimeFormat(slot);
    
    // Update local state first for immediate UI feedback
    setSelectedSlots(prev => 
      prev.includes(normalizedSlot)
        ? prev.filter(s => s !== normalizedSlot)
        : [...prev, normalizedSlot].sort()
    );
    
    // Then call the parent handler with the original format
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
