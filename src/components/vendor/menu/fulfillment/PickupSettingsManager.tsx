
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, MapPinIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/components/vendor/menu/types/category";
import { DaySelector } from "./pickup/DaySelector";

// Day names array for display purposes
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface PickupSettingsManagerProps {
  categories: Category[];
}

export function PickupSettingsManager({ categories }: PickupSettingsManagerProps) {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save pickup setting
  const handleSavePickupSetting = async () => {
    if (!pickupTime.trim() || !location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both pickup time and location.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // We'll use the vendor's ID if available, but the important thing is 
      // to make sure pickup settings are created consistently
      const { error } = await supabase
        .from('pickup_settings')
        .insert({
          day: selectedDay,
          time: pickupTime,
          location: location
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });

      toast({
        title: "Success",
        description: `Pickup setting for ${dayNames[selectedDay]} has been saved.`
      });

      // Reset the form
      setPickupTime("");
      setLocation("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save pickup setting: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Pickup Configuration</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your pickup days, times, and locations. These settings will apply to all items that have pickup as a fulfillment option.
          </p>

          <div className="space-y-6">
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <CalendarIcon className="h-4 w-4" /> Day
              </Label>
              <DaySelector selectedDay={selectedDay} onDayChange={setSelectedDay} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <Clock className="h-4 w-4" /> Time
                </Label>
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="12:00 PM"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <MapPinIcon className="h-4 w-4" /> Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Pickup location"
                />
              </div>
            </div>

            <Button 
              onClick={handleSavePickupSetting} 
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? "Saving..." : "Add Pickup Setting"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
