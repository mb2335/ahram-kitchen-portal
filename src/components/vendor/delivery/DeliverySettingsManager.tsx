
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from 'date-fns';
import { generateFixedTimeSlots } from "@/types/delivery";
import { useVendorId } from "@/hooks/useVendorId";

export function DeliverySettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();
  const [activeDay, setActiveDay] = useState<string>("0");
  const [isSaving, setIsSaving] = useState(false);
  
  // Store active days and time slots in state
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [activeTimeSlotsByDay, setActiveTimeSlotsByDay] = useState<Record<number, string[]>>({});

  // Fetch vendor delivery settings
  const { data: vendorSettings = null, isLoading } = useQuery({
    queryKey: ['vendor-delivery-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId
  });

  // Initialize state from fetched settings
  useEffect(() => {
    if (vendorSettings) {
      setActiveDays(vendorSettings.active_days || []);
      
      // Initialize active time slots for each day
      const timeSlotsByDay: Record<number, string[]> = {};
      for (const day of vendorSettings.active_days || []) {
        timeSlotsByDay[day] = vendorSettings.time_slots || [];
      }
      setActiveTimeSlotsByDay(timeSlotsByDay);
    }
  }, [vendorSettings]);

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const toggleDayActive = async (dayOfWeek: number, active: boolean) => {
    if (!vendorId) return;
    
    try {
      setIsSaving(true);
      
      // Update active days array
      let newActiveDays = [...activeDays];
      
      if (active) {
        // If enabling a day, add it to the active days
        if (!newActiveDays.includes(dayOfWeek)) {
          newActiveDays.push(dayOfWeek);
          newActiveDays.sort();
        }
      } else {
        // If disabling a day, remove it from active days
        newActiveDays = newActiveDays.filter(day => day !== dayOfWeek);
      }
      
      setActiveDays(newActiveDays);
      
      // Update time slots for the day if needed
      if (active && !activeTimeSlotsByDay[dayOfWeek]) {
        setActiveTimeSlotsByDay(prev => ({
          ...prev,
          [dayOfWeek]: vendorSettings?.time_slots || []
        }));
      }
      
      // Collect all unique time slots across all active days
      const allTimeSlots = new Set<string>();
      Object.keys(activeTimeSlotsByDay).forEach(dayKey => {
        const day = parseInt(dayKey);
        if (newActiveDays.includes(day)) {
          activeTimeSlotsByDay[day].forEach(slot => allTimeSlots.add(slot));
        }
      });
      
      // Save changes to database
      await saveChangesToDatabase(newActiveDays, Array.from(allTimeSlots));
      
      toast({
        title: "Success",
        description: `Delivery for ${getDayName(dayOfWeek)} ${active ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling day active:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery day status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimeSlot = async (dayOfWeek: number, timeSlot: string) => {
    if (!vendorId) return;
    
    try {
      setIsSaving(true);
      
      // Get current time slots for the day
      const currentSlots = activeTimeSlotsByDay[dayOfWeek] || [];
      
      // Toggle the time slot
      const newSlots = currentSlots.includes(timeSlot)
        ? currentSlots.filter(slot => slot !== timeSlot)
        : [...currentSlots, timeSlot].sort();
      
      // Update state
      setActiveTimeSlotsByDay(prev => ({
        ...prev,
        [dayOfWeek]: newSlots
      }));
      
      // Collect all unique time slots across all active days
      const allTimeSlots = new Set<string>();
      Object.keys(activeTimeSlotsByDay).forEach(dayKey => {
        const day = parseInt(dayKey);
        if (day !== dayOfWeek && activeDays.includes(day)) {
          activeTimeSlotsByDay[day].forEach(slot => allTimeSlots.add(slot));
        }
      });
      
      // Add the new slots for the current day
      newSlots.forEach(slot => allTimeSlots.add(slot));
      
      // Save changes to database
      await saveChangesToDatabase(activeDays, Array.from(allTimeSlots));
      
      toast({
        title: "Success",
        description: "Time slots updated successfully",
      });
    } catch (error) {
      console.error('Error updating time slots:', error);
      toast({
        title: "Error",
        description: "Failed to update time slots",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveChangesToDatabase = async (days: number[], slots: string[]) => {
    if (!vendorId) return;
    
    // Update vendor delivery settings
    const { error } = await supabase
      .from('delivery_settings')
      .upsert({
        vendor_id: vendorId,
        active_days: days,
        time_slots: slots,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'vendor_id'
      });
    
    if (error) throw error;
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['vendor-delivery-settings'] });
  };

  const allTimeSlots = generateFixedTimeSlots();

  if (isLoading) {
    return <div>Loading delivery settings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Delivery Time Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure which days and times are available for delivery.
          These settings will apply to all categories that have delivery enabled.
        </p>
      </div>

      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <TabsList className="mb-4">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <TabsTrigger key={day} value={day.toString()}>
              {getDayName(day)}
            </TabsTrigger>
          ))}
        </TabsList>

        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const isActive = activeDays.includes(day);
          const activeSlots = activeTimeSlotsByDay[day] || [];

          return (
            <TabsContent key={day} value={day.toString()}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`active-${day}`} className="text-base">
                      Enable {getDayName(day)} Deliveries
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to select delivery times on {getDayName(day)}s
                    </p>
                  </div>
                  <Switch
                    id={`active-${day}`}
                    checked={isActive}
                    onCheckedChange={(checked) => toggleDayActive(day, checked)}
                  />
                </div>

                {isActive && (
                  <div className="space-y-4">
                    <Label className="text-base">Available Time Slots</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {allTimeSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={activeSlots.includes(slot) ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          onClick={() => toggleTimeSlot(day, slot)}
                          disabled={isSaving}
                        >
                          {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
}
