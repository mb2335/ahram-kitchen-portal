
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormSetValue } from "react-hook-form";
import { MenuFormData } from "../types";

interface CategorySelectionProps {
  watchCategoryId: string | undefined;
  setValue: UseFormSetValue<MenuFormData>;
  watchIsAvailable: boolean;
}

export function CategorySelection({ 
  watchCategoryId, 
  setValue, 
  watchIsAvailable 
}: CategorySelectionProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data.map(category => ({
        ...category,
        allow_joint_pickup: category.allow_joint_pickup ?? false
      }));
    },
  });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select 
          onValueChange={(value) => setValue('category_id', value)}
          value={watchCategoryId}
        >
          <SelectTrigger>
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
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="is_available" 
          checked={watchIsAvailable}
          onCheckedChange={(checked) => setValue('is_available', checked)}
          disabled={!watchCategoryId}
        />
        <Label htmlFor="is_available">
          Available
          {!watchCategoryId && (
            <span className="ml-2 text-sm text-muted-foreground">
              (Requires category)
            </span>
          )}
        </Label>
      </div>
    </>
  );
}
