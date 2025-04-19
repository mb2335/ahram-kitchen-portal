
import { generateFixedTimeSlots } from "@/types/delivery";
import { Button } from "@/components/ui/button";
import { DeliveryDaysSelector } from "./delivery/DeliveryDaysSelector";
import { TimeSlotSelector } from "./delivery/TimeSlotSelector";
import { useDeliverySettings } from "./delivery/hooks/useDeliverySettings";

export function DeliverySettingsManager() {
  const {
    selectedDays,
    setSelectedDays,
    activatedSlots,
    setActivatedSlots,
    isSaving,
    isLoading,
    saveDeliverySettings
  } = useDeliverySettings();

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleTimeSlot = (timeSlot: string) => {
    console.log(`Toggling time slot: ${timeSlot}`);
    console.log(`Current activated slots before toggle:`, activatedSlots);
    
    setActivatedSlots(prev => {
      const newSlots = prev.includes(timeSlot)
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot].sort();
      
      console.log(`Updated activated slots after toggle:`, newSlots);
      return newSlots;
    });
  };

  if (isLoading) {
    return <div>Loading delivery settings...</div>;
  }

  const allTimeSlots = generateFixedTimeSlots();

  return (
    <div className="space-y-6">
      <DeliveryDaysSelector
        selectedDays={selectedDays}
        onDayToggle={toggleDay}
      />

      <TimeSlotSelector
        timeSlots={allTimeSlots}
        activatedSlots={activatedSlots}
        onTimeSlotToggle={toggleTimeSlot}
        isSaving={isSaving}
      />
      
      <Button 
        onClick={saveDeliverySettings} 
        className="w-full" 
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Delivery Settings"}
      </Button>
    </div>
  );
}
