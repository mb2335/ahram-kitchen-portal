
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, TrashIcon, ClockIcon, Timer as TimerIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DeliverySchedule, DAY_NAMES, generateTimeSlots, formatTime } from "@/types/delivery";

interface DeliveryTimeSlotsProps {
  categoryId: string;
  categoryName: string;
}

export function DeliveryTimeSlots({ categoryId, categoryName }: DeliveryTimeSlotsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("0");

  // Load existing schedules
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['delivery-schedules', categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select('*')
        .eq('category_id', categoryId)
        .order('day_of_week');
      
      if (error) throw error;
      return data as Array<{
        id: string;
        category_id: string;
        day_of_week: number;
        time_interval: number;
        start_time: string;
        end_time: string;
        active: boolean;
        created_at: string;
      }>;
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
        category_id: categoryId,
        day_of_week: i,
        time_interval: 30,
        start_time: '09:00',
        end_time: '17:00',
        active: false
      };
    }
    
    // Override with existing schedules
    schedules.forEach(schedule => {
      newSchedulesByDay[schedule.day_of_week] = {
        id: schedule.id,
        category_id: schedule.category_id,
        day_of_week: schedule.day_of_week,
        time_interval: schedule.time_interval,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        active: schedule.active,
        created_at: schedule.created_at || undefined
      };
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
      
      if (new Date(`1970-01-01T${schedule.start_time}`) >= new Date(`1970-01-01T${schedule.end_time}`)) {
        toast({
          title: "Invalid Time Range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }
      
      if (schedule.id) {
        // Update existing schedule
        const { error } = await supabase
          .from('delivery_schedules')
          .update({
            time_interval: schedule.time_interval,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            active: schedule.active
          })
          .eq('id', schedule.id);
          
        if (error) throw error;
      } else {
        // Create new schedule
        const scheduleData = {
            category_id: categoryId,
            day_of_week: dayOfWeek,
            time_interval: schedule.time_interval,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            active: schedule.active
        };
        
        const { error } = await supabase
          .from('delivery_schedules')
          .insert([scheduleData]);
          
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
  
  const handleTimeIntervalChange = (dayOfWeek: number, value: string) => {
    const interval = parseInt(value, 10);
    setSchedulesByDay(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        time_interval: interval
      }
    }));
  };
  
  const handleStartTimeChange = (dayOfWeek: number, value: string) => {
    setSchedulesByDay(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        start_time: value
      }
    }));
  };
  
  const handleEndTimeChange = (dayOfWeek: number, value: string) => {
    setSchedulesByDay(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        end_time: value
      }
    }));
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
  
  if (isLoading) {
    return <div>Loading delivery schedules...</div>;
  }
  
  const getTimeSlotPreview = (schedule: DeliverySchedule) => {
    if (!schedule.active) return [];
    
    return generateTimeSlots(
      schedule.start_time,
      schedule.end_time,
      schedule.time_interval
    ).map(formatTime);
  };

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
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`${day}-interval`}>Time Interval</Label>
                  <Select 
                    value={schedule.time_interval.toString()}
                    onValueChange={(value) => handleTimeIntervalChange(dayOfWeek, value)}
                  >
                    <SelectTrigger id={`${day}-interval`}>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${day}-start`}>Start Time</Label>
                  <Input
                    id={`${day}-start`}
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) => handleStartTimeChange(dayOfWeek, e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${day}-end`}>End Time</Label>
                  <Input
                    id={`${day}-end`}
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) => handleEndTimeChange(dayOfWeek, e.target.value)}
                  />
                </div>
              </div>
              
              {schedule.active && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Time Slots Preview
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getTimeSlotPreview(schedule).map((time, index) => (
                      <div 
                        key={index} 
                        className="px-3 py-1 text-xs bg-secondary rounded-md"
                      >
                        {time}
                      </div>
                    ))}
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
