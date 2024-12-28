import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
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
        <div className="flex gap-2">
          <Input
            type="date"
            value={formData.deliveryAvailableFrom ? format(formData.deliveryAvailableFrom, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleDateInput('deliveryAvailableFrom', e.target.value)}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-10 p-0",
                  !formData.deliveryAvailableFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={formData.deliveryAvailableFrom}
                onSelect={(date) => setFormData({ ...formData, deliveryAvailableFrom: date })}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Delivery Available Until</Label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={formData.deliveryAvailableUntil ? format(formData.deliveryAvailableUntil, 'yyyy-MM-dd') : ''}
            onChange={(e) => handleDateInput('deliveryAvailableUntil', e.target.value)}
            className="flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-10 p-0",
                  !formData.deliveryAvailableUntil && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={formData.deliveryAvailableUntil}
                onSelect={(date) => setFormData({ ...formData, deliveryAvailableUntil: date })}
                disabled={(date) => date < (formData.deliveryAvailableFrom || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {formData.name ? 'Save Changes' : 'Add Category'}
      </Button>
    </form>
  );
}