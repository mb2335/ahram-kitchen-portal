
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useVendorId } from "@/hooks/useVendorId";

export function PickupSettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { vendorId } = useVendorId();
  const [activeDay, setActiveDay] = useState<string>("0");
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['pickup-settings', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('day');
        
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId
  });

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const addPickupOption = async (day: number) => {
    if (!vendorId) return;
    
    try {
      setIsSaving(true);
      
      await supabase
        .from('pickup_settings')
        .insert({
          vendor_id: vendorId,
          day,
          time: '',
          location: ''
        });
        
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
      
      toast({
        title: "Success",
        description: "New pickup option added",
      });
    } catch (error) {
      console.error('Error adding pickup option:', error);
      toast({
        title: "Error",
        description: "Failed to add pickup option",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePickupOption = async (id: string, field: string, value: string) => {
    try {
      setIsSaving(true);
      
      await supabase
        .from('pickup_settings')
        .update({ [field]: value })
        .eq('id', id);
        
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
    } catch (error) {
      console.error('Error updating pickup option:', error);
      toast({
        title: "Error",
        description: "Failed to update pickup option",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePickupOption = async (id: string) => {
    try {
      setIsSaving(true);
      
      await supabase
        .from('pickup_settings')
        .delete()
        .eq('id', id);
        
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
      
      toast({
        title: "Success",
        description: "Pickup option deleted",
      });
    } catch (error) {
      console.error('Error deleting pickup option:', error);
      toast({
        title: "Error",
        description: "Failed to delete pickup option",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading pickup settings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Pickup Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure pickup locations and times for each day of the week.
          These settings will apply to all categories that have pickup enabled.
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
          const daySettings = settings.filter(s => s.day === day);

          return (
            <TabsContent key={day} value={day.toString()}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{getDayName(day)} Pickup Options</h3>
                  <Button
                    onClick={() => addPickupOption(day)}
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pickup Option
                  </Button>
                </div>

                {daySettings.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-muted-foreground">
                      No pickup options configured for {getDayName(day)}.
                      Click the button above to add one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {daySettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded-md"
                      >
                        <div className="flex-1 space-y-2">
                          <Label>Time</Label>
                          <Input
                            value={setting.time || ''}
                            onChange={(e) => updatePickupOption(setting.id, 'time', e.target.value)}
                            placeholder="e.g., 2:00 PM"
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={setting.location || ''}
                            onChange={(e) => updatePickupOption(setting.id, 'location', e.target.value)}
                            placeholder="e.g., Store Front"
                            className="w-full"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePickupOption(setting.id)}
                          disabled={isSaving}
                          className="mt-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
