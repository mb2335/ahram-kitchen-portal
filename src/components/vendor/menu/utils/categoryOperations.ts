
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Category } from "../types/category";

export async function checkCategoryItems(categoryId: string) {
  try {
    const { data: items, error } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error checking category items:', error);
      throw error;
    }

    return items?.length || 0;
  } catch (error) {
    console.error('Error in checkCategoryItems:', error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    throw error;
  }
}

export async function removeItemsCategory(categoryId: string) {
  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ category_id: null })
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error removing category from items:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in removeItemsCategory:', error);
    throw error;
  }
}

export async function deleteMenuItems(categoryId: string) {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error deleting menu items:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteMenuItems:', error);
    throw error;
  }
}

export async function updateCategoryOrder(categories: { id: string; order_index: number }[]) {
  try {
    for (const category of categories) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ order_index: category.order_index })
        .eq('id', category.id);

      if (error) {
        console.error('Error updating category order:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error in updateCategoryOrder:', error);
    throw error;
  }
}
