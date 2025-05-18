
import { supabase } from "@/integrations/supabase/client";
import { Category } from "../types/category";
import { toast } from "@/hooks/use-toast";

export async function updateCategoryOrder(categories: { id: string; order_index: number }[]) {
  try {
    for (const category of categories) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ order_index: category.order_index })
        .eq('id', category.id);

      if (error) throw error;
    }
    
    // Show success notification
    toast({
      title: "Order updated",
      description: "Category order has been updated successfully",
    });
    
    return true;
  } catch (error) {
    console.error('Error updating category order:', error);
    
    toast({
      title: "Error",
      description: "Failed to update category order",
      variant: "destructive",
    });
    
    throw error;
  }
}

export function prepareReorderedCategories(
  categories: Category[],
  oldIndex: number,
  newIndex: number
): Category[] {
  const reorderedCategories = [...categories];
  const [movedItem] = reorderedCategories.splice(oldIndex, 1);
  reorderedCategories.splice(newIndex, 0, movedItem);
  
  // Update order_index for all items
  return reorderedCategories.map((category, index) => ({
    ...category,
    order_index: index + 1,
  }));
}
