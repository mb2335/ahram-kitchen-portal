import { useState } from "react";
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

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['delivery-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('day_of_week');
        
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId
  });

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const toggleTimeSlot = async (dayOfWeek: number, timeSlot: string) => {
    if (!vendorId) return;
    
    try {
      setIsSaving(true);
      const daySetting = settings.find(s => s.day_of_week === dayOfWeek);
      const slots = daySetting?.activated_slots || [];
      
      const newSlots = slots.includes(timeSlot)
        ? slots.filter(slot => slot !== timeSlot)
        : [...slots, timeSlot].sort();
        
      if (daySetting) {
        await supabase
          .from('delivery_settings')
          .update({ activated_slots: newSlots })
          .eq('id', daySetting.id);
      } else {
        await supabase
          .from('delivery_settings')
          .insert({
            vendor_id: vendorId,
            day_of_week: dayOfWeek,
            active: true,
            activated_slots: newSlots
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
      
      toast({
        title: "Success",
        description: "Delivery time slots updated successfully",
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

  const toggleDayActive = async (dayOfWeek: number, active: boolean) => {
    if (!vendorId) return;
    
    try {
      setIsSaving(true);
      const daySetting = settings.find(s => s.day_of_week === dayOfWeek);
      
      if (daySetting) {
        await supabase
          .from('delivery_settings')
          .update({ active })
          .eq('id', daySetting.id);
      } else {
        await supabase
          .from('delivery_settings')
          .insert({
            vendor_id: vendorId,
            day_of_week: dayOfWeek,
            active,
            activated_slots: []
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
      
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
          const daySetting = settings.find(s => s.day_of_week === day);
          const isActive = daySetting?.active ?? false;
          const activeSlots = daySetting?.activated_slots || [];

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
