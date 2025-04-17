
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
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime, generateFixedTimeSlots } from "@/types/delivery";

export function DeliverySettingsManager({ categories }: { categories: Category[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.length > 0 ? categories[0].id : ""
  );
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [activatedSlots, setActivatedSlots] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedDays([]);
    setActivatedSlots([]);
  };

  // Toggle day selection
  const handleDayChange = (day: number, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, day]);
    } else {
      setSelectedDays(selectedDays.filter(d => d !== day));
    }
  };

  // Toggle time slot selection
  const toggleTimeSlot = (timeSlot: string) => {
    if (activatedSlots.includes(timeSlot)) {
      setActivatedSlots(activatedSlots.filter(slot => slot !== timeSlot));
    } else {
      setActivatedSlots([...activatedSlots, timeSlot].sort());
    }
  };

  // Save delivery settings
  const saveDeliverySettings = async () => {
    if (!selectedCategoryId || selectedDays.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // Update delivery settings for all selected days
      for (const day of selectedDays) {
        const { data: existingSettings } = await supabase
          .from('delivery_settings')
          .select('id')
          .eq('category_id', selectedCategoryId)
          .eq('day_of_week', day)
          .single();

        if (existingSettings) {
          await supabase
            .from('delivery_settings')
            .update({
              active: true,
              activated_slots: activatedSlots
            })
            .eq('id', existingSettings.id);
        } else {
          await supabase
            .from('delivery_settings')
            .insert({
              category_id: selectedCategoryId,
              day_of_week: day,
              active: true,
              activated_slots: activatedSlots
            });
        }
      }

      // Set inactive for non-selected days
      await supabase
        .from('delivery_settings')
        .update({ active: false })
        .eq('category_id', selectedCategoryId)
        .not('day_of_week', 'in', `(${selectedDays.join(',')})`);

      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
      
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
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      
      {selectedCategoryId && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Select Days Available for Delivery</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dayNames.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${index}`}
                    checked={selectedDays.includes(index)}
                    onCheckedChange={(checked) => 
                      handleDayChange(index, checked as boolean)
                    }
                  />
                  <Label htmlFor={`day-${index}`}>{day}</Label>
                </div>
              ))}
            </div>
          </div>
          
          {selectedDays.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Available Time Slots</Label>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Select which time slots are available for delivery on the selected days.
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
                onClick={saveDeliverySettings} 
                className="w-full" 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Delivery Settings"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
