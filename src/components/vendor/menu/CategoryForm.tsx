import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CategoryFormData } from "./types/category";

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CategoryForm({ formData, setFormData, onSubmit }: CategoryFormProps) {
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.deliveryAvailableFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deliveryAvailableFrom ? (
                format(formData.deliveryAvailableFrom, "PPP")
              ) : (
                <span>Pick a start date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.deliveryAvailableFrom}
              onSelect={(date) => setFormData({ ...formData, deliveryAvailableFrom: date || undefined })}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Delivery Available Until</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.deliveryAvailableUntil && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.deliveryAvailableUntil ? (
                format(formData.deliveryAvailableUntil, "PPP")
              ) : (
                <span>Pick an end date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.deliveryAvailableUntil}
              onSelect={(date) => setFormData({ ...formData, deliveryAvailableUntil: date || undefined })}
              disabled={(date) => date < (formData.deliveryAvailableFrom || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button type="submit" className="w-full">
        {formData.name ? 'Save Changes' : 'Add Category'}
      </Button>
    </form>
  );
}