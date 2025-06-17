
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DeliveryDaysSelectorProps {
  selectedDays: number[];
  onDayToggle: (day: number) => void;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function DeliveryDaysSelector({ selectedDays, onDayToggle }: DeliveryDaysSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Available Days</Label>
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day) => (
          <Button
            key={day.value}
            variant={selectedDays.includes(day.value) ? "default" : "outline"}
            size="sm"
            className="w-full text-xs"
            onClick={() => onDayToggle(day.value)}
          >
            {day.label.slice(0, 3)}
          </Button>
        ))}
      </div>
    </div>
  );
}
