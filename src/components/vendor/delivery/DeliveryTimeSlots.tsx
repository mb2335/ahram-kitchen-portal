
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TimeSlot, DeliverySchedule } from '@/types/delivery';
import { v4 as uuidv4 } from 'uuid';

export function DeliveryTimeSlots({ categoryId }: { categoryId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSchedule, setEditingSchedule] = useState<DeliverySchedule | null>(null);
  
  // Fetch existing delivery schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['delivery-schedules', categoryId],
    queryFn: async () => {
      const query = supabase.from('delivery_schedules')
        .select('*') as any;
        
      if (categoryId) {
        query.eq('category_id', categoryId);
      } else {
        query.is('category_id', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DeliverySchedule[];
    },
  });
  
  // Save or update a delivery schedule
  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: DeliverySchedule) => {
      const isNew = !schedule.id || schedule.id.startsWith('new-');
      const preparedSchedule = {
        ...schedule,
        id: isNew ? undefined : schedule.id,
        category_id: categoryId || null
      };
      
      const { data, error } = isNew
        ? await supabase.from('delivery_schedules').insert(preparedSchedule as any).select()
        : await supabase.from('delivery_schedules').update(preparedSchedule as any).eq('id', schedule.id).select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
      setEditingSchedule(null);
      toast({
        title: "Schedule saved",
        description: "The delivery schedule has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete a delivery schedule
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('delivery_schedules')
        .delete()
        .eq('id', scheduleId) as any;
        
      if (error) throw error;
      return scheduleId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
      toast({
        title: "Schedule deleted",
        description: "The delivery schedule has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting schedule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleAddSchedule = () => {
    setEditingSchedule({
      id: `new-${uuidv4()}`,
      day_of_week: 1, // Monday by default
      time_slots: [],
      active: true
    });
  };
  
  const handleAddTimeSlot = () => {
    if (!editingSchedule) return;
    
    setEditingSchedule({
      ...editingSchedule,
      time_slots: [
        ...editingSchedule.time_slots,
        {
          id: uuidv4(),
          start_time: "09:00",
          end_time: "10:00",
          available: true
        }
      ]
    });
  };
  
  const handleRemoveTimeSlot = (slotId: string) => {
    if (!editingSchedule) return;
    
    setEditingSchedule({
      ...editingSchedule,
      time_slots: editingSchedule.time_slots.filter(slot => slot.id !== slotId)
    });
  };
  
  const updateTimeSlot = (slotId: string, field: keyof TimeSlot, value: any) => {
    if (!editingSchedule) return;
    
    setEditingSchedule({
      ...editingSchedule,
      time_slots: editingSchedule.time_slots.map(slot => 
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    });
  };
  
  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Delivery Time Slots</h2>
        <Button onClick={handleAddSchedule}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>
      
      {isLoading ? (
        <div>Loading schedules...</div>
      ) : (
        <div className="grid gap-4">
          {schedules.map(schedule => (
            <Card key={schedule.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {weekDays.find(d => d.value === schedule.day_of_week)?.label} Schedule
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${schedule.id}`}
                        checked={schedule.active}
                        onCheckedChange={async (checked) => {
                          await saveScheduleMutation.mutateAsync({
                            ...schedule,
                            active: checked
                          });
                        }}
                      />
                      <Label htmlFor={`active-${schedule.id}`}>
                        {schedule.active ? "Active" : "Inactive"}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingSchedule(schedule)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {schedule.time_slots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {schedule.time_slots.map(slot => (
                      <div
                        key={slot.id}
                        className={`p-2 border rounded-md flex items-center justify-between ${
                          !slot.available ? "bg-muted/20" : ""
                        }`}
                      >
                        <span>
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {slot.booked_by ? "Booked" : "Available"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No time slots defined</p>
                )}
              </CardContent>
            </Card>
          ))}
          
          {schedules.length === 0 && !editingSchedule && (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No delivery schedules have been created yet.
              </p>
              <Button onClick={handleAddSchedule} className="mt-4">
                Create Your First Schedule
              </Button>
            </div>
          )}
        </div>
      )}
      
      {editingSchedule && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              {editingSchedule.id.startsWith('new') ? "Create" : "Edit"} Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="day-of-week">Day of Week</Label>
                  <Select
                    value={editingSchedule.day_of_week.toString()}
                    onValueChange={(value) => 
                      setEditingSchedule({
                        ...editingSchedule,
                        day_of_week: parseInt(value)
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Time Slots</Label>
                    <Button size="sm" variant="outline" onClick={handleAddTimeSlot}>
                      <PlusCircle className="h-4 w-4 mr-1" /> Add Slot
                    </Button>
                  </div>
                  
                  {editingSchedule.time_slots.map((slot, index) => (
                    <div key={slot.id} className="flex items-center space-x-2 p-2 border rounded-md">
                      <div className="grid grid-cols-2 gap-2 flex-grow">
                        <div>
                          <Label htmlFor={`start-time-${index}`} className="text-xs">
                            Start Time
                          </Label>
                          <Input
                            id={`start-time-${index}`}
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => updateTimeSlot(slot.id, 'start_time', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`end-time-${index}`} className="text-xs">
                            End Time
                          </Label>
                          <Input
                            id={`end-time-${index}`}
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateTimeSlot(slot.id, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center space-x-1">
                          <Switch
                            id={`available-${index}`}
                            checked={slot.available}
                            onCheckedChange={(checked) => 
                              updateTimeSlot(slot.id, 'available', checked)
                            }
                          />
                          <Label htmlFor={`available-${index}`} className="text-xs whitespace-nowrap">
                            Available
                          </Label>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleRemoveTimeSlot(slot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {editingSchedule.time_slots.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">
                        No time slots added yet. Click "Add Slot" to create one.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSchedule(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveScheduleMutation.mutate(editingSchedule)}
                  disabled={saveScheduleMutation.isPending}
                >
                  {saveScheduleMutation.isPending
                    ? "Saving..."
                    : editingSchedule.id.startsWith('new')
                      ? "Create Schedule"
                      : "Update Schedule"
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
