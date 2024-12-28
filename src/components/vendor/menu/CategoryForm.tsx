import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      <Button type="submit" className="w-full">
        {formData.name ? 'Save Changes' : 'Add Category'}
      </Button>
    </form>
  );
}