
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { generateFixedTimeSlots } from "@/types/delivery";
import { useVendorId } from "@/hooks/useVendorId";

export function DeliverySettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing delivery settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['delivery-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('active', true);
        
      if (error) throw error;
      console.log("Fetched delivery settings:", data);
      return data;
    },
    enabled: !!vendorId
  });

  // Initialize state from fetched settings
  useEffect(() => {
    if (settings && settings.length > 0) {
      // Extract active days
      const activeDays = settings.map(setting => setting.day_of_week);
      setSelectedDays(activeDays);
      
      // Find all unique time slots across all days
      const uniqueSlots = new Set<string>();
      settings.forEach(setting => {
        if (setting.activated_slots && Array.isArray(setting.activated_slots)) {
          setting.activated_slots.forEach(slot => uniqueSlots.add(slot));
        }
      });
      
      setActivatedSlots(Array.from(uniqueSlots).sort());
    }
  }, [settings]);

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const toggleTimeSlot = (timeSlot: string) => {
    setActivatedSlots(prev => 
      prev.includes(timeSlot)
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot].sort()
    );
  };

  const saveDeliverySettings = async () => {
    if (!vendorId || selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day for delivery",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // First, deactivate all existing settings
      await supabase
        .from('delivery_settings')
        .update({ active: false })
        .eq('vendor_id', vendorId);
      
      // Then create or update settings for selected days
      for (const day of selectedDays) {
        // Check if setting for this day already exists
        const { data: existingSetting } = await supabase
          .from('delivery_settings')
          .select('id')
          .eq('vendor_id', vendorId)
          .eq('day_of_week', day)
          .single();

        if (existingSetting) {
          // Update existing setting
          await supabase
            .from('delivery_settings')
            .update({
              active: true,
              activated_slots: activatedSlots
            })
            .eq('id', existingSetting.id);
        } else {
          // Create new setting
          await supabase
            .from('delivery_settings')
            .insert({
              vendor_id: vendorId,
              day_of_week: day,
              active: true,
              activated_slots: activatedSlots
            });
        }
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
      
      toast({
        title: "Success",
        description: "Delivery settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast({
        title: "Error",
        description: "Failed to save delivery settings",
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
    <div className="space-y-6">
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
              onClick={() => toggleDay(day)}
            >
              {getDayName(day)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Available Time Slots</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select the time slots available for delivery on selected days.
          </p>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {allTimeSlots.map((slot) => (
            <Button
              key={slot}
              variant={activatedSlots.includes(slot) ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => toggleTimeSlot(slot)}
              disabled={isSaving}
            >
              {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {activatedSlots.length} time slots selected
        </p>
        
        <Button 
          onClick={saveDeliverySettings} 
          className="w-full" 
          disabled={isSaving || selectedDays.length === 0}
        >
          {isSaving ? "Saving..." : "Save Delivery Settings"}
        </Button>
      </div>
    </div>
  );
}
