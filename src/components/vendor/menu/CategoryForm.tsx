
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { CategoryFormData, PickupDetail } from "./types/category";
import { Badge } from "@/components/ui/badge";

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
      }
    }
    
    setFormData({
      ...formData,
      pickup_days: newPickupDays
    });
  };

  const getDayName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
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
