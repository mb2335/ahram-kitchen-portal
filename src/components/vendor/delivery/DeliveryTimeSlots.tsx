import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ClockIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  DeliverySchedule, 
  DAY_NAMES, 
  generateFixedTimeSlots, 
  formatTime 
} from "@/types/delivery";

interface DeliveryTimeSlotsProps {
  categoryId: string;
  categoryName: string;
}

export function DeliveryTimeSlots({ 
  categoryId, 
  categoryName 
}: DeliveryTimeSlotsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("0");

  // Load existing schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['delivery-schedules', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .order('day_of_week');
      
      if (error) throw error;
      return data as unknown as DeliverySchedule[];
    },
  });

  // Create default schedules for days that don't have one
  const [schedulesByDay, setSchedulesByDay] = useState<Record<number, DeliverySchedule>>({});

  useEffect(() => {
    const newSchedulesByDay: Record<number, DeliverySchedule> = {};
    
    // Initialize with default values for all days
    for (let i = 0; i < 7; i++) {
      newSchedulesByDay[i] = {
        id: '', // Empty ID means it's a new schedule
        vendor_id: '', // This will be set when saved
        day_of_week: i,
        active: false,
        activated_slots: []
      };
    }
    
    // Override with existing schedules
    schedules.forEach(schedule => {
      newSchedulesByDay[schedule.day_of_week] = schedule;
    });
    
    setSchedulesByDay(newSchedulesByDay);
    
    // If we don't have an active tab yet, set it to the first day
    if (activeTab === "" && Object.keys(newSchedulesByDay).length) {
      setActiveTab("0");
    }
  }, [schedules, categoryId]);

  const handleSaveSchedule = async (dayOfWeek: number) => {
    try {
      const schedule = schedulesByDay[dayOfWeek];
      
      if (!schedule) {
        throw new Error("Schedule not found");
      }
      
      if (schedule.id) {
        // Update existing schedule
        const { error } = await supabase
          .from('delivery_settings')
          .update({
            active: schedule.active,
            activated_slots: schedule.activated_slots || []
          })
          .eq('id', schedule.id);
          
        if (error) throw error;
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('delivery_settings')
          .insert({
            vendor_id: categoryId, // This needs to be updated with the actual vendor ID
            day_of_week: dayOfWeek,
            active: schedule.active,
            activated_slots: schedule.activated_slots || []
          });
          
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `Delivery schedule for ${DAY_NAMES[dayOfWeek]} has been saved.`,
      });
      
      // Invalidate delivery schedules query to refetch data
      queryClient.invalidateQueries({ queryKey: ['delivery-schedules'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save delivery schedule",
        variant: "destructive",
      });
    }
  };
  
  const handleActiveChange = (dayOfWeek: number, value: boolean) => {
    setSchedulesByDay(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        active: value
      }
    }));
  };
  
  const toggleTimeSlot = (dayOfWeek: number, timeSlot: string) => {
    setSchedulesByDay(prev => {
      const schedule = prev[dayOfWeek];
      const slots = schedule.activated_slots || [];
      
      const newSlots = slots.includes(timeSlot)
        ? slots.filter(slot => slot !== timeSlot)
        : [...slots, timeSlot];
        
      return {
        ...prev,
        [dayOfWeek]: {
          ...schedule,
          activated_slots: newSlots
        }
      };
    });
  };
  
  if (isLoading) {
    return <div>Loading delivery schedules...</div>;
  }
  
  // Generate all possible time slots for the day
  const allTimeSlots = generateFixedTimeSlots();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Delivery Time Slots - {categoryName}</h3>
        <p className="text-sm text-muted-foreground">
          Configure delivery time slots for each day of the week. Customers will be able to select a time slot when placing a delivery order.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-6">
          {DAY_NAMES.map((day, index) => (
            <TabsTrigger 
              key={day} 
              value={index.toString()}
              className="relative"
            >
              {day.substring(0, 3)}
              {schedulesByDay[index]?.active && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {DAY_NAMES.map((day, dayOfWeek) => {
          const schedule = schedulesByDay[dayOfWeek];
          if (!schedule) return null;
          
          return (
            <TabsContent key={day} value={dayOfWeek.toString()} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">{day} Delivery Schedule</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`${day}-active`}
                    checked={schedule.active}
                    onCheckedChange={(value) => handleActiveChange(dayOfWeek, value)}
                  />
                  <Label htmlFor={`${day}-active`}>
                    {schedule.active ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>
              
              {schedule.active && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Time Slots
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Select which time slots are available for customers to choose on {day}s.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                    {allTimeSlots.map((timeSlot) => {
                      const isActivated = schedule.activated_slots?.includes(timeSlot) || false;
                      
                      return (
                        <Button
                          key={timeSlot}
                          variant={isActivated ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() => toggleTimeSlot(dayOfWeek, timeSlot)}
                        >
                          {formatTime(timeSlot)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <Button
                className="w-full mt-4"
                onClick={() => handleSaveSchedule(dayOfWeek)}
              >
                Save {day} Schedule
              </Button>
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
}
