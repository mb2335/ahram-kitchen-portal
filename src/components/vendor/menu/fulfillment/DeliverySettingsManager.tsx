import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "../types/category";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { formatTime, generateFixedTimeSlots } from "@/types/delivery";

export function DeliverySettingsManager({ categories }: { categories: Category[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.length > 0 ? categories[0].id : ""
  );
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Find the selected category
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  
  // Update activated slots when category changes
  useState(() => {
    if (selectedCategory) {
      setActivatedSlots([]);
    } else {
      setActivatedSlots([]);
    }
  });

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActivatedSlots([]);
  };

  // Toggle time slot selection
  const toggleTimeSlot = (timeSlot: string) => {
    if (activatedSlots.includes(timeSlot)) {
      setActivatedSlots(activatedSlots.filter(slot => slot !== timeSlot));
    } else {
      setActivatedSlots([...activatedSlots, timeSlot].sort());
    }
  };

  // Save updated time slots
  const saveTimeSlots = async () => {
    if (!selectedCategoryId) return;
    
    try {
      setIsSaving(true);
      
      // First, get existing delivery settings for this category
      const { data: existingSettings } = await supabase
        .from('delivery_settings')
        .select('id, day_of_week')
        .eq('category_id', selectedCategoryId);
      
      const existingSettingsByDay = new Map();
      if (existingSettings) {
        existingSettings.forEach((setting: any) => {
          existingSettingsByDay.set(setting.day_of_week, setting.id);
        });
      }
      
      // Get pickup days from pickup_settings table instead
      const { data: pickupSettings } = await supabase
        .from('pickup_settings')
        .select('day')
        .eq('category_id', selectedCategoryId);
      
      const pickupDays = pickupSettings ? pickupSettings.map((setting: any) => setting.day) : [];
      
      // Update schedules for each day of the week
      for (let day = 0; day < 7; day++) {
        const isPickupDay = pickupDays.includes(day);
        const active = !isPickupDay; // Active for delivery if not a pickup day
        
        const scheduleData = {
          category_id: selectedCategoryId,
          day_of_week: day,
          active,
          activated_slots: activatedSlots
        };
        
        try {
          if (existingSettingsByDay.has(day)) {
            // Update existing settings
            await supabase
              .from('delivery_settings')
              .update(scheduleData)
              .eq('id', existingSettingsByDay.get(day));
          } else {
            // Create new settings
            await supabase
              .from('delivery_settings')
              .insert([scheduleData]);
          }
        } catch (err) {
          console.error(`Error handling delivery settings for day ${day}:`, err);
          throw err;
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      toast({
        title: "Success",
        description: "Delivery time slots updated successfully",
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

  return (
    <div className="space-y-6">
      <div>
        <Label>Select Category</Label>
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryChange}
          disabled={categories.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator />
      
      {selectedCategoryId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Available Time Slots</Label>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            Select which time slots are available for delivery across all days.
            Pickup days will automatically be blocked for delivery.
          </p>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {allTimeSlots.map(slot => {
              const isActive = activatedSlots.includes(slot);
              return (
                <Button
                  key={slot}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTimeSlot(slot)}
                  className="w-full"
                >
                  {formatTime(slot)}
                </Button>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {activatedSlots.length} time slots selected
          </p>
          
          <Button 
            onClick={saveTimeSlots} 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Time Slots"}
          </Button>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            Select a category to configure delivery settings
          </p>
        </div>
      )}
    </div>
  );
}
