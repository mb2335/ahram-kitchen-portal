import { UseFormRegister } from "react-hook-form";
import { MenuFormData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MenuItem } from "../types";

interface PricingDetailsProps {
  register: UseFormRegister<MenuFormData>;
  errors: Record<string, any>;
  editingItem: MenuItem | null;
}

export function PricingDetails({ register, errors, editingItem }: PricingDetailsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input 
          id="price" 
          type="number" 
          step="0.01" 
          {...register('price', { required: true })} 
        />
        {errors.price && <p className="text-sm text-red-500">Price is required</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount_percentage">Discount Percentage (0-100)</Label>
        <Input 
          id="discount_percentage" 
          type="number" 
          min="0"
          max="100"
          defaultValue={editingItem?.discount_percentage || ''}
          {...register('discount_percentage', {
            min: 0,
            max: 100,
            valueAsNumber: true,
            setValueAs: (value: string) => value === '' ? null : parseInt(value, 10)
          })} 
          placeholder="e.g., 20 for 20% off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity_limit">Quantity Limit (optional)</Label>
        <Input 
          id="quantity_limit" 
          type="number" 
          {...register('quantity_limit')} 
        />
      </div>
    </>
  );
}