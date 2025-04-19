
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorId } from "@/hooks/useVendorId";

export function useDeliverySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

  // Initialize the state when settings are loaded or changed
  useEffect(() => {
    if (settings) {
      setSelectedDays(settings.active_days || []);
      // Ensure we're working with a unique set of time slots
      const uniqueTimeSlots = Array.from(new Set(settings.time_slots || []));
      setActivatedSlots(uniqueTimeSlots);
      console.log("Initialized selected days:", settings.active_days);
      console.log("Initialized unique time slots:", uniqueTimeSlots);
    }
  }, [settings]);

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
      // Ensure we're saving a unique set of time slots
      const uniqueTimeSlots = Array.from(new Set(activatedSlots));
      
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
      
      console.log("Successfully saved delivery settings:", {
        active_days: selectedDays,
        time_slots: uniqueTimeSlots
      });
      
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

  return {
    selectedDays,
    setSelectedDays,
    activatedSlots,
    setActivatedSlots,
    isSaving,
    isLoading,
    saveDeliverySettings
  };
}
