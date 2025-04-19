
import { Button } from "@/components/ui/button";

interface DeliveryDaysSelectorProps {
  selectedDays: number[];
  onDayToggle: (day: number) => void;
}

export function DeliveryDaysSelector({ selectedDays, onDayToggle }: DeliveryDaysSelectorProps) {
  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div>
      <h3 className="text-lg font-semibold">Delivery Days</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Select which days of the week you offer delivery service.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <Button
            key={day}
            variant={selectedDays.includes(day) ? "default" : "outline"}
            className="w-full"
            onClick={() => onDayToggle(day)}
          >
            {getDayName(day)}
          </Button>
        ))}
      </div>
    </div>
  );
}
