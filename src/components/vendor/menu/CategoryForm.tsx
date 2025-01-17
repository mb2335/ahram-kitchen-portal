import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { parse } from "date-fns";
import { CategoryFormData, PickupDetail } from "./types/category";

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryForm({ formData, setFormData, onSubmit }: CategoryFormProps) {
  const handleDateInput = (field: 'deliveryAvailableFrom' | 'deliveryAvailableUntil', value: string) => {
    try {
      if (!value) {
        setFormData({ ...formData, [field]: undefined });
        return;
      }
      
      const parsedDate = parse(value, 'yyyy-MM-dd', new Date());
      if (isNaN(parsedDate.getTime())) {
        return;
      }
      
      setFormData({ ...formData, [field]: parsedDate });
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

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
            <Label>Delivery Available From</Label>
            <Input
              type="date"
              value={formData.deliveryAvailableFrom ? formData.deliveryAvailableFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateInput('deliveryAvailableFrom', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Available Until</Label>
            <Input
              type="date"
              value={formData.deliveryAvailableUntil ? formData.deliveryAvailableUntil.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateInput('deliveryAvailableUntil', e.target.value)}
              className="w-full"
              min={formData.deliveryAvailableFrom ? formData.deliveryAvailableFrom.toISOString().split('T')[0] : undefined}
            />
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
            <Label htmlFor="has_custom_pickup">Custom locations & times</Label>
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

        <Button type="submit" className="w-full mb-6">
          {formData.name ? 'Save Changes' : 'Add Category'}
        </Button>
      </form>
    </ScrollArea>
  );
}