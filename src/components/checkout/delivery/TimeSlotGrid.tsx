
import { TimeSlot, formatTime } from '@/types/delivery';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimeSlotGridProps {
  timeSlots: TimeSlot[];
  selectedTimeSlot: string | null;
  onTimeSlotChange: (timeSlot: string) => void;
}

export function TimeSlotGrid({ 
  timeSlots, 
  selectedTimeSlot, 
  onTimeSlotChange 
}: TimeSlotGridProps) {
  return (
    <ScrollArea className="max-h-64 border rounded-md">
      <RadioGroup
        value={selectedTimeSlot || ""}
        onValueChange={onTimeSlotChange}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2"
      >
        {timeSlots.map((slot) => (
          <div key={slot.time} className="relative">
            <RadioGroupItem
              value={slot.time}
              id={`time-${slot.time}`}
              disabled={!slot.available}
              className="peer sr-only"
            />
            <Label
              htmlFor={`time-${slot.time}`}
              className={`flex h-10 w-full items-center justify-center rounded-md border border-muted text-center text-sm transition-colors 
                ${slot.available ? 
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted/50' : 
                  'opacity-50 cursor-not-allowed bg-muted/20 line-through'
                }`}
            >
              {formatTime(slot.time)}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </ScrollArea>
  );
}
