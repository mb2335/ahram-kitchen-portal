
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';
import { generateFixedTimeSlots } from "@/types/delivery";
import { usePickupSettings } from './hooks/usePickupSettings';

interface SimplePickupManagerProps {
  schedules: any[];
  onSaveSchedule: (schedule: any) => void;
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

export function SimplePickupManager({ schedules, onSaveSchedule }: SimplePickupManagerProps) {
  const {
    selectedDays,
    setSelectedDays,
    activatedSlots,
    setActivatedSlots,
    isSaving,
    isLoading,
    savePickupSettings
  } = usePickupSettings();

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleTimeSlot = (timeSlot: string) => {
    console.log(`Toggling pickup time slot: ${timeSlot}`);
    console.log(`Current activated pickup slots before toggle:`, activatedSlots);
    
    // Normalize the time slot being toggled
    const normalizedTimeSlot = normalizeTimeFormat(timeSlot);
    
    setActivatedSlots(prev => {
      // Check if the normalized version exists in the array
      const exists = prev.some(slot => normalizeTimeFormat(slot) === normalizedTimeSlot);
      
      // Create new array based on existence check
      const newSlots = exists
        ? prev.filter(slot => normalizeTimeFormat(slot) !== normalizedTimeSlot)
        : [...prev, normalizedTimeSlot].sort();
      
      console.log(`Updated activated pickup slots after toggle:`, newSlots);
      return newSlots;
    });
  };

  // Helper function to normalize time format (HH:MM)
  const normalizeTimeFormat = (timeStr: string): string => {
    // Extract hours and minutes, ignoring seconds if present
    const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return timeStr; // Return original if not matching expected format
    
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    
    return `${hours}:${minutes}`;
  };

  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isSlotActivated = (slot: string) => {
    const normalizedSlot = normalizeTimeFormat(slot);
    return activatedSlots.some(activeSlot => normalizeTimeFormat(activeSlot) === normalizedSlot);
  };

  if (isLoading) {
    return <div>Loading pickup settings...</div>;
  }

  const allTimeSlots = generateFixedTimeSlots();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          In-Store Pickup Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your in-store pickup availability. Enable specific days and set available time slots for customer reservations.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Pickup Schedule</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select which days and times are available for pickup orders.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Available Days</Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map((day) => (
                    <Button
                      key={day.value}
                      variant={selectedDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Available Time Slots
                </Label>
                <p className="text-sm text-muted-foreground">
                  Each time slot can only be booked by one customer per day.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {allTimeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={isSlotActivated(slot) ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleTimeSlot(slot)}
                      disabled={isSaving}
                    >
                      {formatDisplayTime(slot)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={savePickupSettings} 
                className="w-full" 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Pickup Settings"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
