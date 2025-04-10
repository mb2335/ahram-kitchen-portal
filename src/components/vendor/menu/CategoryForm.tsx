import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, ArrowRight, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { CategoryFormData, PickupDetail } from "./types/category";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryForm({ formData, setFormData, onSubmit }: CategoryFormProps) {
  const [dayToCopyFrom, setDayToCopyFrom] = useState<number | null>(null);
  const [dayToCopyTo, setDayToCopyTo] = useState<number | null>(null);
  
  // Time selector UI states
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  
  const { data: categories = [] } = useQuery({
    queryKey: ['copy-pickup-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name, has_custom_pickup, pickup_details, fulfillment_types, pickup_days')
        .filter('has_custom_pickup', 'eq', true)
        .filter('fulfillment_types', 'cs', '{"pickup"}');
      
      if (error) throw error;
      return data;
    },
  });

  const addPickupDetail = (day: number) => {
    const newDetail: PickupDetail = { day, time: '', location: '' };
    setFormData({
      ...formData,
      pickup_details: [...formData.pickup_details, newDetail]
    });
  };

  const removePickupDetail = (index: number) => {
    const newPickupDetails = formData.pickup_details.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      pickup_details: newPickupDetails
    });
  };

  const updatePickupDetail = (index: number, field: keyof PickupDetail, value: any) => {
    const newPickupDetails = formData.pickup_details.map((detail, i) => {
      if (i === index) {
        return { ...detail, [field]: value };
      }
      return detail;
    });
    setFormData({
      ...formData,
      pickup_details: newPickupDetails
    });
  };

  const handleFulfillmentTypeChange = (type: string, checked: boolean) => {
    let newFulfillmentTypes = [...formData.fulfillment_types];
    
    if (checked) {
      if (!newFulfillmentTypes.includes(type)) {
        newFulfillmentTypes.push(type);
      }
    } else {
      newFulfillmentTypes = newFulfillmentTypes.filter(t => t !== type);
    }
    
    setFormData({
      ...formData,
      fulfillment_types: newFulfillmentTypes
    });
  };

  const handlePickupDayChange = (day: number, checked: boolean) => {
    const newPickupDays = [...formData.pickup_days];
    
    if (checked) {
      if (!newPickupDays.includes(day)) {
        newPickupDays.push(day);
      }
    } else {
      const index = newPickupDays.indexOf(day);
      if (index !== -1) {
        newPickupDays.splice(index, 1);
        
        const filteredPickupDetails = formData.pickup_details.filter(
          detail => detail.day !== day
        );
        
        setFormData({
          ...formData,
          pickup_days: newPickupDays,
          pickup_details: filteredPickupDetails
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      pickup_days: newPickupDays
    });
  };

  const handleCopyPickupDetails = (categoryId: string) => {
    const selectedCategory = categories.find(category => category.id === categoryId);
    if (!selectedCategory) return;
    
    setFormData({
      ...formData,
      has_custom_pickup: selectedCategory.has_custom_pickup,
      pickup_details: selectedCategory.pickup_details.map((detail: any) => ({
        day: detail.day !== undefined ? detail.day : 0,
        time: detail.time || '',
        location: detail.location || ''
      })),
      pickup_days: selectedCategory.pickup_days || []
    });
  };

  const handleDeliverySettingChange = (field: keyof CategoryFormData['delivery_settings'], value: any) => {
    setFormData({
      ...formData,
      delivery_settings: {
        ...formData.delivery_settings,
        [field]: value
      }
    });
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getPickupDetailsForDay = (day: number): PickupDetail[] => {
    return formData.pickup_details.filter(detail => detail.day === day);
  };

  const copyPickupDetailsFromDay = () => {
    if (dayToCopyFrom === null || dayToCopyTo === null) return;
    
    const detailsToCopy = formData.pickup_details
      .filter(detail => detail.day === dayToCopyFrom)
      .map(detail => ({
        ...detail,
        day: dayToCopyTo
      }));
    
    const filteredDetails = formData.pickup_details.filter(
      detail => detail.day !== dayToCopyTo
    );
    
    setFormData({
      ...formData,
      pickup_details: [...filteredDetails, ...detailsToCopy]
    });
    
    setDayToCopyFrom(null);
    setDayToCopyTo(null);
  };

  const timeIntervalOptions = [30, 60, 90, 120];

  const generateHourOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      options.push(`${hour}:00`);
    }
    return options;
  };
  
  const hourOptions = generateHourOptions();
  
  // Format time for display
  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select time";
    
    const hour = parseInt(time.split(':')[0]);
    const minute = time.split(':')[1] || "00";
    
    if (hour === 0) return `12:${minute} AM`;
    if (hour === 12) return `12:${minute} PM`;
    return hour < 12 ? `${hour}:${minute} AM` : `${hour - 12}:${minute} PM`;
  };

  return (
    <ScrollArea className="h-[80vh] w-full">
      <form onSubmit={onSubmit} className="space-y-6 px-8">
        <div className="space-y-4 pr-6">
          <div className="space-y-2">
            <Label>Name (English)</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter category name in English"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Name (Korean)</Label>
            <Input
              value={formData.name_ko}
              onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
              required
              placeholder="Enter category name in Korean"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Fulfillment Types</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delivery-type"
                  checked={formData.fulfillment_types.includes('delivery')}
                  onCheckedChange={(checked) => 
                    handleFulfillmentTypeChange('delivery', checked as boolean)
                  }
                />
                <Label htmlFor="delivery-type">Delivery</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pickup-type"
                  checked={formData.fulfillment_types.includes('pickup')}
                  onCheckedChange={(checked) => 
                    handleFulfillmentTypeChange('pickup', checked as boolean)
                  }
                />
                <Label htmlFor="pickup-type">Pickup</Label>
              </div>
            </div>
          </div>

          {formData.fulfillment_types.includes('delivery') && (
            <div className="space-y-4 border p-4 rounded-md">
              <Label className="text-base font-semibold">Delivery Time Slots</Label>
              <p className="text-sm text-muted-foreground">
                Set the time slots for delivery. This will determine when customers can schedule deliveries.
              </p>
              
              <Card className="bg-secondary/10">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Time Interval</Label>
                    </div>
                    <Select
                      value={formData.delivery_settings?.time_interval?.toString() || "30"}
                      onValueChange={(value) => handleDeliverySettingChange('time_interval', parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="max-h-[200px]">
                          {timeIntervalOptions.map((interval) => (
                            <SelectItem key={interval} value={interval.toString()}>
                              {interval === 60 ? "1 hour" : interval === 120 ? "2 hours" : `${interval} minutes`}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enhanced Start Time Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>Start Time</Label>
                    </div>
                    <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={startTimeOpen}
                          className="w-full justify-between font-normal"
                        >
                          {formData.delivery_settings?.start_time 
                            ? formatTimeDisplay(formData.delivery_settings.start_time)
                            : "Select start time"}
                          {startTimeOpen ? (
                            <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <ScrollArea className="h-72 rounded-md border">
                          <div className="grid grid-cols-1 gap-1 p-2">
                            {hourOptions.map((time) => (
                              <Button
                                key={time}
                                variant="ghost"
                                className={cn(
                                  "justify-start font-normal",
                                  formData.delivery_settings?.start_time === time && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                  handleDeliverySettingChange('start_time', time);
                                  setStartTimeOpen(false);
                                }}
                              >
                                {formatTimeDisplay(time)}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Enhanced End Time Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label>End Time</Label>
                    </div>
                    <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={endTimeOpen}
                          className="w-full justify-between font-normal"
                        >
                          {formData.delivery_settings?.end_time 
                            ? formatTimeDisplay(formData.delivery_settings.end_time)
                            : "Select end time"}
                          {endTimeOpen ? (
                            <ChevronUp className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <ScrollArea className="h-72 rounded-md border">
                          <div className="grid grid-cols-1 gap-1 p-2">
                            {hourOptions
                              .filter(time => (!formData.delivery_settings?.start_time || time > formData.delivery_settings?.start_time))
                              .map((time) => (
                                <Button
                                  key={time}
                                  variant="ghost"
                                  className={cn(
                                    "justify-start font-normal",
                                    formData.delivery_settings?.end_time === time && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => {
                                    handleDeliverySettingChange('end_time', time);
                                    setEndTimeOpen(false);
                                  }}
                                >
                                  {formatTimeDisplay(time)}
                                </Button>
                              ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {formData.fulfillment_types.includes('pickup') && (
            <div className="space-y-4 border p-4 rounded-md">
              <Label className="text-base font-semibold">Pickup Settings</Label>
              
              {categories.length > 0 && (
                <div className="space-y-2 bg-secondary/20 p-3 rounded-md">
                  <Label>Copy Pickup Details from Existing Category</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={handleCopyPickupDetails}>
                      <SelectTrigger className="flex-1">
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      disabled={categories.length === 0}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will copy pickup days and locations from the selected category
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Select Days Available for Pickup</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={formData.pickup_days.includes(day)}
                        onCheckedChange={(checked) => 
                          handlePickupDayChange(day, checked as boolean)
                        }
                      />
                      <Label htmlFor={`day-${day}`}>{getDayName(day)}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  These days will be available for pickup and blocked for delivery.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_custom_pickup"
                  checked={formData.has_custom_pickup}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      has_custom_pickup: checked as boolean,
                      pickup_details: checked ? formData.pickup_details : []
                    })
                  }
                />
                <Label htmlFor="has_custom_pickup">Custom pickup locations & times</Label>
              </div>

              {formData.has_custom_pickup && formData.pickup_days.length > 0 && (
                <div className="space-y-6">
                  <div className="space-y-2 bg-secondary/20 p-3 rounded-md">
                    <Label>Copy Pickup Details Between Days</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={dayToCopyFrom?.toString() || ''}
                        onValueChange={(val) => setDayToCopyFrom(Number(val))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Copy from day" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.pickup_days.map((day) => (
                            <SelectItem key={`from-${day}`} value={day.toString()}>
                              {getDayName(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <ArrowRight className="h-4 w-4" />

                      <Select
                        value={dayToCopyTo?.toString() || ''}
                        onValueChange={(val) => setDayToCopyTo(Number(val))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Copy to day" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.pickup_days.map((day) => (
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
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue={formData.pickup_days[0]?.toString()}>
                    <TabsList className="mb-4 flex flex-wrap h-auto">
                      {formData.pickup_days.map((day) => (
                        <TabsTrigger key={day} value={day.toString()} className="mb-1">
                          {getDayName(day)}
                          <Badge variant="outline" className="ml-2">
                            {getPickupDetailsForDay(day).length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {formData.pickup_days.map((day) => (
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

                        <Separator />

                        {getPickupDetailsForDay(day).length === 0 ? (
                          <div className="text-center p-4 border border-dashed rounded-md">
                            <p className="text-muted-foreground">
                              No pickup details for {getDayName(day)}. Add one above.
                            </p>
                          </div>
                        ) : (
                          getPickupDetailsForDay(day).map((detail, index) => {
                            const actualIndex = formData.pickup_details.findIndex(
                              d => d === detail
                            );
                            
                            return (
                              <div key={index} className="flex gap-4 items-start bg-secondary/10 p-4 rounded-lg">
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
                            );
                          })
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full mb-6">
          {formData.name ? 'Save Changes' : 'Add Category'}
        </Button>
      </form>
    </ScrollArea>
  );
}
