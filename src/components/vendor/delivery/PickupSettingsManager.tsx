
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PickupDetail } from "@/types/pickup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PickupSettingsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [pickupDays, setPickupDays] = useState<number[]>([]);
  const [pickupDetails, setPickupDetails] = useState<PickupDetail[]>([]);
  const [dayToCopyFrom, setDayToCopyFrom] = useState<number | null>(null);
  const [dayToCopyTo, setDayToCopyTo] = useState<number | null>(null);
  const [activeDay, setActiveDay] = useState<string>("0");

  // Load pickup days and details from pickup_settings table
  const fetchPickupSettings = async () => {
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id')
      .single();
      
    if (vendorData) {
      const { data } = await supabase
        .from('pickup_settings')
        .select('*')
        .eq('vendor_id', vendorData.id);
      
      if (data && data.length > 0) {
        // Extract unique days
        const days = Array.from(new Set(data.map(item => item.day)));
        setPickupDays(days);
        
        // Map to pickup details
        const details = data.map(item => ({
          day: item.day,
          time: item.time || '',
          location: item.location || ''
        }));
        setPickupDetails(details);
        
        // Set active day
        if (days.length > 0) {
          setActiveDay(days[0].toString());
        }
      }
    }
  };

  const handlePickupDayChange = (day: number, checked: boolean) => {
    let newPickupDays = [...pickupDays];
    
    if (checked) {
      if (!newPickupDays.includes(day)) {
        newPickupDays.push(day);
      }
    } else {
      const index = newPickupDays.indexOf(day);
      if (index !== -1) {
        newPickupDays.splice(index, 1);
        
        // Remove pickup details for this day
        const filteredPickupDetails = pickupDetails.filter(
          detail => detail.day !== day
        );
        
        setPickupDetails(filteredPickupDetails);
      }
    }
    
    setPickupDays(newPickupDays);
    
    // If we just added a day and it's our first or only day, make it active
    if (checked && (newPickupDays.length === 1 || !pickupDays.includes(day))) {
      setActiveDay(day.toString());
    } else if (!checked && activeDay === day.toString() && newPickupDays.length > 0) {
      // If we removed the active day, set to another available day
      setActiveDay(newPickupDays[0].toString());
    }
  };

  const addPickupDetail = (day: number) => {
    const newDetail: PickupDetail = { day, time: '', location: '' };
    setPickupDetails([...pickupDetails, newDetail]);
  };

  const removePickupDetail = (index: number) => {
    const newPickupDetails = pickupDetails.filter((_, i) => i !== index);
    setPickupDetails(newPickupDetails);
  };

  const updatePickupDetail = (index: number, field: keyof PickupDetail, value: any) => {
    const newPickupDetails = pickupDetails.map((detail, i) => {
      if (i === index) {
        return { ...detail, [field]: value };
      }
      return detail;
    });
    setPickupDetails(newPickupDetails);
  };

  const copyPickupDetailsFromDay = () => {
    if (dayToCopyFrom === null || dayToCopyTo === null) return;
    
    const detailsToCopy = pickupDetails
      .filter(detail => detail.day === dayToCopyFrom)
      .map(detail => ({
        ...detail,
        day: dayToCopyTo
      }));
    
    const filteredDetails = pickupDetails.filter(
      detail => detail.day !== dayToCopyTo
    );
    
    setPickupDetails([...filteredDetails, ...detailsToCopy]);
    
    setDayToCopyFrom(null);
    setDayToCopyTo(null);
  };

  const savePickupSettings = async () => {
    try {
      setIsSaving(true);
      
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .single();
      
      if (!vendorData) {
        throw new Error('Vendor not found');
      }
      
      // Delete all existing pickup settings for this vendor
      await supabase
        .from('pickup_settings')
        .delete()
        .eq('vendor_id', vendorData.id);
      
      // Re-insert pickup settings
      if (pickupDetails.length > 0) {
        const pickupSettingsToInsert = pickupDetails.map(detail => ({
          vendor_id: vendorData.id,
          day: detail.day,
          time: detail.time,
          location: detail.location
        }));
        
        await supabase
          .from('pickup_settings')
          .insert(pickupSettingsToInsert);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['pickup-settings'] });
      
      toast({
        title: "Success",
        description: "Pickup settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving pickup settings:', error);
      toast({
        title: "Error",
        description: "Failed to save pickup settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getPickupDetailsForDay = (day: number): PickupDetail[] => {
    return pickupDetails.filter(detail => detail.day === day);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Days Available for Pickup</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day}`}
                checked={pickupDays.includes(day)}
                onCheckedChange={(checked) => 
                  handlePickupDayChange(day, checked as boolean)
                }
              />
              <Label htmlFor={`day-${day}`}>{getDayName(day)}</Label>
            </div>
          ))}
        </div>
      </div>

      {pickupDays.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-2 bg-secondary/20 p-3 rounded-md">
            <Label>Copy Pickup Details Between Days</Label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Select
                value={dayToCopyFrom?.toString() || ''}
                onValueChange={(val) => setDayToCopyFrom(Number(val))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Copy from day" />
                </SelectTrigger>
                <SelectContent>
                  {pickupDays.map((day) => (
                    <SelectItem key={`from-${day}`} value={day.toString()}>
                      {getDayName(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ArrowRight className="hidden sm:block h-4 w-4" />

              <Select
                value={dayToCopyTo?.toString() || ''}
                onValueChange={(val) => setDayToCopyTo(Number(val))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Copy to day" />
                </SelectTrigger>
                <SelectContent>
                  {pickupDays.map((day) => (
                    <SelectItem key={`to-${day}`} value={day.toString()}>
                      {getDayName(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                disabled={dayToCopyFrom === null || dayToCopyTo === null}
                onClick={copyPickupDetailsFromDay}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          <Tabs value={activeDay} onValueChange={setActiveDay}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {pickupDays.map((day) => (
                <TabsTrigger key={day} value={day.toString()} className="mb-1">
                  {getDayName(day)}
                  <Badge variant="outline" className="ml-2">
                    {getPickupDetailsForDay(day).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {pickupDays.map((day) => (
              <TabsContent key={day} value={day.toString()} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{getDayName(day)} Pickup Options</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPickupDetail(day)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time & Location
                  </Button>
                </div>

                {getPickupDetailsForDay(day).length === 0 ? (
                  <div className="text-center p-4 border border-dashed rounded-md">
                    <p className="text-muted-foreground">
                      No pickup details for {getDayName(day)}. Add one above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getPickupDetailsForDay(day).map((detail, index) => {
                      const actualIndex = pickupDetails.findIndex(
                        d => d === detail
                      );
                      
                      return (
                        <Card key={index} className="p-4">
                          <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="flex-1 space-y-2">
                              <Label>Pickup Time</Label>
                              <Input
                                value={detail.time}
                                onChange={(e) => updatePickupDetail(actualIndex, 'time', e.target.value)}
                                placeholder="e.g., 1:00 PM"
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label>Pickup Location</Label>
                              <Input
                                value={detail.location}
                                onChange={(e) => updatePickupDetail(actualIndex, 'location', e.target.value)}
                                placeholder="e.g., Kirkland"
                                className="w-full"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="mt-8"
                              onClick={() => removePickupDetail(actualIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
      
      <Button 
        onClick={savePickupSettings} 
        className="w-full" 
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Pickup Settings"}
      </Button>
    </div>
  );
}

