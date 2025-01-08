import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parse } from "date-fns";
import { CategoryFormData } from "./types/category";

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
        return; // Invalid date, don't update
      }
      
      setFormData({ ...formData, [field]: parsedDate });
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="block text-sm font-medium mb-1">Name (English)</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Name (Korean)</Label>
        <Input
          value={formData.name_ko}
          onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Delivery Available From</Label>
        <Input
          type="date"
          value={formData.deliveryAvailableFrom ? formData.deliveryAvailableFrom.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDateInput('deliveryAvailableFrom', e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="space-y-2">
        <Label>Delivery Available Until</Label>
        <Input
          type="date"
          value={formData.deliveryAvailableUntil ? formData.deliveryAvailableUntil.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDateInput('deliveryAvailableUntil', e.target.value)}
          className="flex-1"
          min={formData.deliveryAvailableFrom ? formData.deliveryAvailableFrom.toISOString().split('T')[0] : undefined}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="has_custom_pickup"
          checked={formData.has_custom_pickup}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, has_custom_pickup: checked as boolean })
          }
        />
        <Label htmlFor="has_custom_pickup">Custom locations & times</Label>
      </div>

      {formData.has_custom_pickup && (
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>Pickup Time</Label>
            <Input
              value={formData.pickup_time || ''}
              onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
              placeholder="e.g., 2-4 PM"
            />
          </div>
          <div className="flex-1">
            <Label>Pickup Location</Label>
            <Input
              value={formData.pickup_location || ''}
              onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
              placeholder="e.g., Main Entrance"
            />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full">
        {formData.name ? 'Save Changes' : 'Add Category'}
      </Button>
    </form>
  );
}