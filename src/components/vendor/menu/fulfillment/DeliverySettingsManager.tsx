
import { generateFixedTimeSlots } from "@/types/delivery";
import { Button } from "@/components/ui/button";
import { DeliveryDaysSelector } from "./delivery/DeliveryDaysSelector";
import { TimeSlotSelector } from "./delivery/TimeSlotSelector";
import { useDeliverySettings } from "./delivery/hooks/useDeliverySettings";

// Helper function to normalize time format (HH:MM)
const normalizeTimeFormat = (timeStr: string): string => {
  // Extract hours and minutes, ignoring seconds if present
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return timeStr; // Return original if not matching expected format
  
  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  
  return `${hours}:${minutes}`;
};

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
    
    // Normalize the time slot being toggled
    const normalizedTimeSlot = normalizeTimeFormat(timeSlot);
    
    setActivatedSlots(prev => {
      // Check if the normalized version exists in the array
      const exists = prev.some(slot => normalizeTimeFormat(slot) === normalizedTimeSlot);
      
      // Create new array based on existence check
      const newSlots = exists
        ? prev.filter(slot => normalizeTimeFormat(slot) !== normalizedTimeSlot)
        : [...prev, normalizedTimeSlot].sort();
      
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
