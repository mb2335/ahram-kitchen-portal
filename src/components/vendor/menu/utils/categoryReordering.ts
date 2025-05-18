
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Category } from "../types/category";

export async function updateCategoryOrder(categories: { id: string; order_index: number }[]) {
  try {
    // Process categories in sequence to ensure order is maintained
    for (const category of categories) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ order_index: category.order_index })
        .eq('id', category.id);

      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating category order:', error);
    toast({
      title: "Error",
      description: "Failed to update category order",
      variant: "destructive",
    });
    return false;
  }
}
