import { UseFormRegister } from "react-hook-form";
import { MenuFormData } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PricingDetailsProps {
  register: UseFormRegister<MenuFormData>;
  errors: Record<string, any>;
}

export function PricingDetails({ register, errors }: PricingDetailsProps) {
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
        <Label htmlFor="discount_percentage">Discount Percentage (optional)</Label>
        <Input 
          id="discount_percentage" 
          type="number" 
          min="0"
          max="100"
          {...register('discount_percentage')} 
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