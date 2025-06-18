
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
  const handleTimeSlotChange = (value: string) => {
    // Find the selected slot to check if it's available
    const selectedSlot = timeSlots.find(slot => slot.time === value);
    if (selectedSlot && selectedSlot.available) {
      onTimeSlotChange(value);
    }
  };

  return (
    <ScrollArea className="max-h-64 border rounded-md">
      <RadioGroup
        value={selectedTimeSlot || ""}
        onValueChange={handleTimeSlotChange}
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
              className={`flex h-10 w-full items-center justify-center rounded-md border text-center text-sm transition-colors cursor-pointer
                ${slot.available ? 
                  'border-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:bg-muted/50' : 
                  'opacity-50 cursor-not-allowed bg-muted/30 border-muted text-muted-foreground line-through'
                }`}
            >
              <span className={slot.available ? '' : 'line-through'}>
                {formatTime(slot.time)}
              </span>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </ScrollArea>
  );
}
