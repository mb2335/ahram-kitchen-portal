
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Clock, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TimeSlot {
  id?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

interface DaySchedule {
  day: number;
  is_active: boolean;
  time_slots: TimeSlot[];
}

interface SimplePickupManagerProps {
  schedules: DaySchedule[];
  onSaveSchedule: (schedule: DaySchedule) => void;
}

export function SimplePickupManager({ schedules, onSaveSchedule }: SimplePickupManagerProps) {
  const [activeDay, setActiveDay] = useState<string>("0");

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getDaySchedule = (day: number): DaySchedule => {
    return schedules.find(s => s.day === day) || {
      day,
      is_active: false,
      time_slots: []
    };
  };

  const updateDaySchedule = (day: number, updates: Partial<DaySchedule>) => {
    const currentSchedule = getDaySchedule(day);
    const updatedSchedule = { ...currentSchedule, ...updates };
    onSaveSchedule(updatedSchedule);
  };

  const toggleDayActive = (day: number, active: boolean) => {
    updateDaySchedule(day, { is_active: active });
  };

  const addTimeSlot = (day: number) => {
    const schedule = getDaySchedule(day);
    const newSlot: TimeSlot = {
      id: `temp-${Date.now()}`,
      start_time: '12:00',
      end_time: '15:00',
      location: 'In-Store Pickup'
    };
    
    updateDaySchedule(day, {
      time_slots: [...schedule.time_slots, newSlot]
    });
  };

  const updateTimeSlot = (day: number, slotIndex: number, field: keyof TimeSlot, value: string) => {
    const schedule = getDaySchedule(day);
    const updatedSlots = [...schedule.time_slots];
    updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value };
    
    updateDaySchedule(day, { time_slots: updatedSlots });
  };

  const removeTimeSlot = (day: number, slotIndex: number) => {
    const schedule = getDaySchedule(day);
    const updatedSlots = schedule.time_slots.filter((_, index) => index !== slotIndex);
    
    updateDaySchedule(day, { time_slots: updatedSlots });
  };

  const validateTimeSlot = (startTime: string, endTime: string): boolean => {
    return startTime < endTime;
  };

  const hasOverlappingSlots = (slots: TimeSlot[]): boolean => {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];
        
        if (
          (slot1.start_time < slot2.end_time && slot1.end_time > slot2.start_time) ||
          (slot2.start_time < slot1.end_time && slot2.end_time > slot1.start_time)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          In-Store Pickup Schedule
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your in-store pickup availability. Customers can only select pickup during these times.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="mb-4 grid grid-cols-7 w-full">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <TabsTrigger key={day} value={day.toString()} className="text-xs">
                {getDayName(day).slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          {[0, 1, 2, 3, 4, 5, 6].map((day) => {
            const schedule = getDaySchedule(day);
            const hasOverlaps = hasOverlappingSlots(schedule.time_slots);

            return (
              <TabsContent key={day} value={day.toString()}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        Enable Pickup on {getDayName(day)}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow customers to schedule pickup on {getDayName(day)}s
                      </p>
                    </div>
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) => toggleDayActive(day, checked)}
                    />
                  </div>

                  {schedule.is_active && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Time Slots
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(day)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Slot
                        </Button>
                      </div>

                      {hasOverlaps && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">
                            Warning: You have overlapping time slots. Please adjust the times.
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {schedule.time_slots.map((slot, index) => {
                          const isValid = validateTimeSlot(slot.start_time, slot.end_time);
                          
                          return (
                            <div
                              key={index}
                              className={`flex gap-3 items-end p-3 border rounded-lg ${
                                !isValid ? 'border-red-300 bg-red-50' : ''
                              }`}
                            >
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor={`start-${day}-${index}`}>Start Time</Label>
                                  <Input
                                    id={`start-${day}-${index}`}
                                    type="time"
                                    value={slot.start_time}
                                    onChange={(e) => updateTimeSlot(day, index, 'start_time', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`end-${day}-${index}`}>End Time</Label>
                                  <Input
                                    id={`end-${day}-${index}`}
                                    type="time"
                                    value={slot.end_time}
                                    onChange={(e) => updateTimeSlot(day, index, 'end_time', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <Label htmlFor={`location-${day}-${index}`}>Location</Label>
                                <Input
                                  id={`location-${day}-${index}`}
                                  value={slot.location || 'In-Store Pickup'}
                                  onChange={(e) => updateTimeSlot(day, index, 'location', e.target.value)}
                                  placeholder="Pickup location"
                                />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(day, index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        
                        {schedule.time_slots.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            No time slots configured for {getDayName(day)}. Add a time slot above.
                          </div>
                        )}
                      </div>

                      {schedule.time_slots.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-600">
                            <strong>{schedule.time_slots.length}</strong> pickup slot{schedule.time_slots.length !== 1 ? 's' : ''} configured for {getDayName(day)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
