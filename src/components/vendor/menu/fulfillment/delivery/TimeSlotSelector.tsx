
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

interface TimeSlotSelectorProps {
  timeSlots: string[];
  activatedSlots: string[];
  onTimeSlotToggle: (timeSlot: string) => void;
  isSaving: boolean;
}

export function TimeSlotSelector({ 
  timeSlots, 
  activatedSlots, 
  onTimeSlotToggle, 
  isSaving 
}: TimeSlotSelectorProps) {
  
  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  };

  const normalizeTimeFormat = (timeStr: string): string => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return timeStr;
    
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    
    return `${hours}:${minutes}`;
  };

  const isSlotActivated = (slot: string) => {
    const normalizedSlot = normalizeTimeFormat(slot);
    return activatedSlots.some(activeSlot => normalizeTimeFormat(activeSlot) === normalizedSlot);
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Available Time Slots</Label>
      <p className="text-sm text-muted-foreground">
        Each time slot can only be booked by one customer per day.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {timeSlots.map((slot) => (
          <Button
            key={slot}
            variant={isSlotActivated(slot) ? "default" : "outline"}
            size="sm"
            className="w-full"
            onClick={() => onTimeSlotToggle(slot)}
            disabled={isSaving}
          >
            {formatDisplayTime(slot)}
          </Button>
        ))}
      </div>
    </div>
  );
}
