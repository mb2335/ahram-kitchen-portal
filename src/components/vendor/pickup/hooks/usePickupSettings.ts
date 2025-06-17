
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVendorId } from '@/hooks/useVendorId';

export const usePickupSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch pickup settings
  const { data: pickupSettings, isLoading } = useQuery({
    queryKey: ['pickup-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .eq('vendor_id', vendorId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorId
  });

  // Initialize state from fetched settings
  useEffect(() => {
    if (pickupSettings && pickupSettings.length > 0) {
      console.log('Loading pickup settings:', pickupSettings);
      
      // Extract unique days
      const days = Array.from(new Set(pickupSettings.map(setting => setting.day)));
      setSelectedDays(days);
      
      // Extract time slots (using start_time primarily, fallback to time)
      const slots = pickupSettings
        .map(setting => setting.start_time || setting.time)
        .filter(Boolean);
      
      setActivatedSlots(slots);
      
      console.log('Initialized pickup days:', days);
      console.log('Initialized pickup slots:', slots);
    }
  }, [pickupSettings]);

  const savePickupSettings = async () => {
    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor information is missing",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day for pickup",
        variant: "destructive",
      });
      return;
    }

    if (activatedSlots.length === 0) {
      toast({
        title: "No Time Slots Selected",
        description: "Please select at least one time slot for pickup",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      console.log('Saving pickup settings for days:', selectedDays);
      console.log('Saving pickup settings for slots:', activatedSlots);
      
      // Delete all existing pickup settings for this vendor
      await supabase
        .from('pickup_settings')
        .delete()
        .eq('vendor_id', vendorId);
      
      // Create new pickup settings for each combination of day and time slot
      const settingsToInsert = [];
      for (const day of selectedDays) {
        for (const slot of activatedSlots) {
          settingsToInsert.push({
            vendor_id: vendorId,
            day: day,
            start_time: slot,
            time: slot, // For backward compatibility
          });
        }
      }
      
      if (settingsToInsert.length > 0) {
        const { error } = await supabase
          .from('pickup_settings')
          .insert(settingsToInsert);
        
        if (error) throw error;
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
      
      toast({
        title: "Success",
        description: "Pickup settings updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving pickup settings:', error);
      toast({
        title: "Error",
        description: `Failed to save pickup settings: ${error.message}`,
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
    savePickupSettings
  };
};
