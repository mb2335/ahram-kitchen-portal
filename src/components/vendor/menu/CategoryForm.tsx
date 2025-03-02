
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy } from "lucide-react";
import { CategoryFormData, PickupDetail } from "./types/category";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryForm({ formData, setFormData, onSubmit }: CategoryFormProps) {
  // Fetch existing categories to copy pickup details from
  const { data: categories = [] } = useQuery({
    queryKey: ['copy-pickup-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('id, name, has_custom_pickup, pickup_details, fulfillment_types, pickup_days, allow_joint_pickup')
        .filter('has_custom_pickup', 'eq', true)
        .filter('fulfillment_types', 'cs', '{"pickup"}');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      return data || [];
    },
  });

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

  const handleCopyPickupDetails = (categoryId: string) => {
    const selectedCategory = categories.find(category => category.id === categoryId);
    if (!selectedCategory) return;
    
    setFormData({
      ...formData,
      has_custom_pickup: selectedCategory.has_custom_pickup || false,
      pickup_details: (selectedCategory.pickup_details || []).map((detail: any) => ({
        time: detail.time || '',
        location: detail.location || ''
      })),
      pickup_days: selectedCategory.pickup_days || [],
      allow_joint_pickup: selectedCategory.allow_joint_pickup || false
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
              
              {/* Copy Pickup Details from Existing Category */}
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
                      pickup_details: checked ? [{ time: '', location: '' }] : []
                    })
                  }
                />
                <Label htmlFor="has_custom_pickup">Custom pickup locations & times</Label>
              </div>

              {/* Allow joint pickup with other items */}
              <div className="flex items-center space-x-2 py-2 bg-secondary/10 px-3 rounded-md">
                <Checkbox
                  id="allow_joint_pickup"
                  checked={formData.allow_joint_pickup}
                  onCheckedChange={(checked) => 
                    setFormData({ 
                      ...formData, 
                      allow_joint_pickup: checked as boolean
                    })
                  }
                />
                <div>
                  <Label htmlFor="allow_joint_pickup">Allow joint pickup with other products</Label>
                  <p className="text-xs text-muted-foreground">
                    If checked, customers can choose to pick this up together with other pickup items
                  </p>
                </div>
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
