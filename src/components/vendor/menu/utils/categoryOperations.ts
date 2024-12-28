import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export async function checkCategoryItems(categoryId: string) {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('id')
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error checking category items:', error);
    throw error;
  }

  return items?.length || 0;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

export async function removeItemsCategory(categoryId: string) {
  const { error } = await supabase
    .from('menu_items')
    .update({ category_id: null })
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error removing category from items:', error);
    throw error;
  }
}

export async function deleteMenuItems(categoryId: string) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error deleting menu items:', error);
    throw error;
  }
}