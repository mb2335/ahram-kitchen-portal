
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

  // Fetch existing delivery settings from vendor_delivery_settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['vendor-delivery-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const { data, error } = await supabase
        .from('vendor_delivery_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .maybeSingle();
        
      if (error) throw error;
      console.log("Fetched delivery settings:", data);
      return data;
    },
    enabled: !!vendorId
  });

  // Initialize state from fetched settings
  useEffect(() => {
    if (settings) {
      // Extract active days from settings
      setSelectedDays(settings.active_days || []);
      
      // Set activated time slots - ensure we have no duplicates
      const uniqueTimeSlots = Array.from(new Set(settings.time_slots || []));
      setActivatedSlots(uniqueTimeSlots);
      console.log("Initialized unique time slots:", uniqueTimeSlots);
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
    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor ID is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Ensure we have no duplicate time slots before saving
      const uniqueTimeSlots = Array.from(new Set(activatedSlots));
      
      // Upsert vendor delivery settings
      const { error } = await supabase
        .from('vendor_delivery_settings')
        .upsert({
          vendor_id: vendorId,
          active_days: selectedDays,
          time_slots: uniqueTimeSlots,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'vendor_id'
        });
      
      if (error) throw error;
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['vendor-delivery-settings'] });
      
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

  // Helper function to check if a time slot is activated
  const isTimeSlotActivated = (timeSlot: string): boolean => {
    return activatedSlots.includes(timeSlot);
  };

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
              variant={isTimeSlotActivated(slot) ? "default" : "outline"}
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
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Delivery Settings"}
        </Button>
      </div>
    </div>
  );
}
