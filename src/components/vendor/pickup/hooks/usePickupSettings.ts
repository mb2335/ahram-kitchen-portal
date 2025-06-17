
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSharedAdminAccess } from '@/hooks/useSharedAdminAccess';

export const usePickupSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { adminData } = useSharedAdminAccess();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch pickup settings - admin view (all settings)
  const { data: pickupSettings, isLoading } = useQuery({
    queryKey: ['pickup-settings-admin'],
    queryFn: async () => {
      // Admin access - fetch ALL pickup settings across the platform
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!adminData
  });

  // Initialize state from fetched settings
  useEffect(() => {
    if (pickupSettings && pickupSettings.length > 0) {
      console.log('Loading pickup settings (admin view):', pickupSettings);
      
      // Extract unique days
      const days = Array.from(new Set(pickupSettings.map(setting => setting.day)));
      setSelectedDays(days);
      
      // Extract time slots (using start_time primarily, fallback to time)
      const slots = pickupSettings
        .map(setting => setting.start_time || setting.time)
        .filter(Boolean);
      
      setActivatedSlots(slots);
      
      console.log('Initialized pickup days (admin):', days);
      console.log('Initialized pickup slots (admin):', slots);
    }
  }, [pickupSettings]);

  const savePickupSettings = async () => {
    if (!adminData) {
      toast({
        title: "Error",
        description: "Admin access required",
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
      
      console.log('Saving pickup settings (admin) for days:', selectedDays);
      console.log('Saving pickup settings (admin) for slots:', activatedSlots);
      
      // Delete all existing pickup settings (platform-wide cleanup)
      await supabase
        .from('pickup_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Create new pickup settings for each combination of day and time slot
      const settingsToInsert = [];
      for (const day of selectedDays) {
        for (const slot of activatedSlots) {
          settingsToInsert.push({
            vendor_id: adminData.id, // Track which admin made this change
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
      queryClient.invalidateQueries({ queryKey: ['pickup-settings-admin'] });
      
      toast({
        title: "Success",
        description: "Platform pickup settings updated successfully (shared across all admins)",
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
