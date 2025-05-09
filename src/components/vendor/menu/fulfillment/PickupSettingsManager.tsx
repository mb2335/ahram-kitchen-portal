
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, MapPinIcon, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/components/vendor/menu/types/category";
import { DaySelector } from "./pickup/DaySelector";
import { useVendorId } from "@/hooks/useVendorId";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatTime } from "@/types/delivery";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

// Day names array for display purposes
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper function to convert time string to minutes for sorting
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
};

interface PickupSettingsManagerProps {
  categories: Category[];
}

export function PickupSettingsManager({ categories }: PickupSettingsManagerProps) {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingSettings, setExistingSettings] = useState<{[key: number]: {id: string, time: string, location: string}[]}>({});
  const [isExistingSettingsOpen, setIsExistingSettingsOpen] = useState<{[key: number]: boolean}>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<{id: string, day: number} | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();

  // Fetch existing pickup settings
  const { data: pickupSettings, isLoading: isLoadingSettings } = useQuery({
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

  // Organize pickup settings by day
  useEffect(() => {
    if (pickupSettings && pickupSettings.length > 0) {
      const settingsByDay: {[key: number]: {id: string, time: string, location: string}[]} = {};
      
      pickupSettings.forEach(setting => {
        if (!settingsByDay[setting.day]) {
          settingsByDay[setting.day] = [];
        }
        
        if (setting.time && setting.location) {
          settingsByDay[setting.day].push({
            id: setting.id,
            time: setting.time,
            location: setting.location
          });
        }
      });
      
      // Sort settings by time within each day
      Object.keys(settingsByDay).forEach(day => {
        settingsByDay[parseInt(day)].sort((a, b) => {
          return timeToMinutes(a.time) - timeToMinutes(b.time);
        });
      });
      
      setExistingSettings(settingsByDay);
      
      // Initialize collapsible state for each day
      const initialCollapseState: {[key: number]: boolean} = {};
      Object.keys(settingsByDay).forEach(day => {
        initialCollapseState[parseInt(day)] = false;
      });
      
      setIsExistingSettingsOpen(initialCollapseState);
    }
  }, [pickupSettings]);

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

    if (!vendorId) {
      toast({
        title: "Cannot Create Setting",
        description: "Vendor ID is required to create pickup settings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Creating global pickup setting with vendor_id:", vendorId);
      
      // Always include vendor_id when creating pickup settings
      const { error } = await supabase
        .from('pickup_settings')
        .insert({
          day: selectedDay,
          time: pickupTime,
          location: location,
          vendor_id: vendorId // Associate with the vendor but settings are global for checkout
        });

      if (error) throw error;

      // Invalidate both the vendor-specific and global pickup settings queries
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });

      toast({
        title: "Success",
        description: `Pickup setting for ${dayNames[selectedDay]} has been saved and will be available to all customers.`
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

  // Delete pickup setting
  const handleDeleteSetting = async () => {
    if (!settingToDelete || !vendorId) return;

    try {
      const { error } = await supabase
        .from('pickup_settings')
        .delete()
        .eq('id', settingToDelete.id)
        .eq('vendor_id', vendorId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });

      toast({
        title: "Success",
        description: `Pickup setting for ${dayNames[settingToDelete.day]} has been deleted.`
      });

      // Close the dialog and reset the setting to delete
      setDeleteDialogOpen(false);
      setSettingToDelete(null);

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete pickup setting: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (id: string, day: number) => {
    setSettingToDelete({ id, day });
    setDeleteDialogOpen(true);
  };

  // Toggle collapsible state for a day
  const toggleCollapsible = (day: number) => {
    setIsExistingSettingsOpen(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Pickup Configuration</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your pickup days, times, and locations. These settings will apply globally to all customers during checkout.
          </p>

          {/* Summary of enabled days */}
          <div className="mb-6">
            <Label className="mb-2 block">Currently Enabled Pickup Days</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(existingSettings).length > 0 ? (
                Object.keys(existingSettings).map((day) => (
                  <Badge key={day} variant="outline" className="px-3 py-1">
                    {dayNames[parseInt(day)]} ({existingSettings[parseInt(day)].length} {existingSettings[parseInt(day)].length === 1 ? 'option' : 'options'})
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No pickup days configured yet.</p>
              )}
            </div>
          </div>

          {/* Existing pickup settings */}
          {!isLoadingSettings && Object.keys(existingSettings).length > 0 && (
            <div className="mb-6 space-y-3 border p-4 rounded-md">
              <h4 className="font-medium">Existing Pickup Settings</h4>
              {Object.keys(existingSettings).map((day) => (
                <Collapsible 
                  key={day} 
                  open={isExistingSettingsOpen[parseInt(day)]} 
                  onOpenChange={() => toggleCollapsible(parseInt(day))}
                  className="border rounded-md p-2"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex justify-between w-full">
                      <span>{dayNames[parseInt(day)]}</span>
                      <Badge>{existingSettings[parseInt(day)].length} {existingSettings[parseInt(day)].length === 1 ? 'option' : 'options'}</Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pt-2 pb-4 space-y-2">
                    {existingSettings[parseInt(day)].map((setting, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(setting.time)}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{setting.location}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(setting.id, parseInt(day))}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
          
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pickup Setting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pickup setting? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSettingToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
