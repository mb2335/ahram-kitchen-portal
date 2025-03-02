
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { CategoryFormData, PickupDetail } from "./types/category";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryForm({ formData, setFormData, onSubmit }: CategoryFormProps) {
  const addPickupDetail = () => {
    setFormData({
      ...formData,
      pickup_details: [...formData.pickup_details, { time: '', location: '' }]
    });
  };

  const removePickupDetail = (index: number) => {
    const newPickupDetails = formData.pickup_details.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      pickup_details: newPickupDetails
    });
  };

  const updatePickupDetail = (index: number, field: keyof PickupDetail, value: string) => {
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

  const handleAddBlockedDate = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Only add if the date isn't already in the array
    if (!formData.blocked_dates.includes(dateString)) {
      setFormData({
        ...formData,
        blocked_dates: [...formData.blocked_dates, dateString]
      });
    }
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    setFormData({
      ...formData,
      blocked_dates: formData.blocked_dates.filter(date => date !== dateToRemove)
    });
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

          {formData.fulfillment_types.includes('pickup') && (
            <div className="space-y-4 border p-4 rounded-md">
              <Label className="text-base font-semibold">Pickup Settings</Label>
              
              <div className="space-y-2">
                <Label>Blocked Dates (Pickup Not Available)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.blocked_dates.map((date) => (
                    <Badge key={date} variant="secondary" className="flex items-center gap-1">
                      {format(parseISO(date), 'MMM d, yyyy')}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => handleRemoveBlockedDate(date)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full flex justify-between items-center">
                      <span>Add Blocked Date</span>
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" onSelect={handleAddBlockedDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <p className="text-sm text-muted-foreground mt-1">
                  All days not blocked are available for pickup (previously only Thu/Fri).
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
                      pickup_details: checked ? [{ time: '', location: '' }] : []
                    })
                  }
                />
                <Label htmlFor="has_custom_pickup">Custom pickup locations & times</Label>
              </div>

              {formData.has_custom_pickup && (
                <div className="space-y-4">
                  {formData.pickup_details.map((detail, index) => (
                    <div key={index} className="flex gap-4 items-start bg-secondary/10 p-4 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <Label>Pickup Time</Label>
                        <Input
                          value={detail.time}
                          onChange={(e) => updatePickupDetail(index, 'time', e.target.value)}
                          placeholder="e.g., 1:00 PM"
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Pickup Location</Label>
                        <Input
                          value={detail.location}
                          onChange={(e) => updatePickupDetail(index, 'location', e.target.value)}
                          placeholder="e.g., Kirkland"
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-8"
                        onClick={() => removePickupDetail(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addPickupDetail}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Time & Location
                  </Button>
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
