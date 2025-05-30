
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "./types";
import { toast } from "@/hooks/use-toast";

export async function updateMenuItemOrder(items: { id: string; order_index: number }[]) {
  try {
    for (const item of items) {
      const { error } = await supabase
        .from('menu_items')
        .update({ order_index: item.order_index })
        .eq('id', item.id);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating menu item order:', error);
    throw error;
  }
}

export async function loadVendorMenuItems() {
  try {
    // Access all menu items since RLS will handle vendor permissions
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error("Error loading menu items:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error in loadVendorMenuItems:", error);
    throw error;
  }
}

export async function loadCategoryMenuItems(categoryId: string | null) {
  try {
    let query = supabase
      .from('menu_items')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    } else {
      query = query.is('category_id', null);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error loading category menu items:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error in loadCategoryMenuItems:", error);
    throw error;
  }
}

export async function saveMenuItem(
  menuItemData: Omit<MenuItem, 'id' | 'vendor_id' | 'created_at'>,
  editingItemId?: string
) {
  try {
    // Format the discount percentage to ensure it's a number or null
    const formattedData = {
      ...menuItemData,
      discount_percentage: menuItemData.discount_percentage || null
    };

    if (editingItemId) {
      // Update existing menu item
      const { error } = await supabase
        .from('menu_items')
        .update(formattedData)
        .eq('id', editingItemId);

      if (error) {
        console.error('Error updating menu item:', error);
        throw error;
      }
    } else {
      // Insert new menu item
      const { error } = await supabase
        .from('menu_items')
        .insert([formattedData]);

      if (error) {
        console.error('Error inserting menu item:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(itemId: string) {
  try {
    // Get the item's image URL first
    const { data: item, error: fetchError } = await supabase
      .from('menu_items')
      .select('image')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      console.error('Error fetching menu item:', fetchError);
      throw fetchError;
    }

    // If there's an image, delete it from storage
    if (item?.image) {
      const fileName = item.image.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('menu_items')
          .remove([fileName]);

        if (storageError) {
          console.error('Error deleting image:', storageError);
        }
      }
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Success",
      description: "Menu item deleted successfully",
      variant: "default",
    });

  } catch (error) {
    console.error('Error in deleteMenuItem:', error);
    throw error;
  }
}

export async function handleImageUpload(file: File) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('menu_items')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('menu_items')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
