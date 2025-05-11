
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "./types";
import { toast } from "@/hooks/use-toast";

export async function updateMenuItemOrder(items: { id: string; order_index: number }[]) {
  for (const item of items) {
    const { error } = await supabase
      .from('menu_items')
      .update({ order_index: item.order_index })
      .eq('id', item.id);

    if (error) throw error;
  }
}

export async function loadVendorMenuItems() {
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
}

export async function saveMenuItem(
  menuItemData: Omit<MenuItem, 'id' | 'vendor_id' | 'created_at'>,
  editingItemId?: string
) {
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Authentication required');

  // Format the discount percentage to ensure it's a number or null
  const formattedData = {
    ...menuItemData,
    discount_percentage: menuItemData.discount_percentage || null
  };

  try {
    if (editingItemId) {
      const { error } = await supabase
        .from('menu_items')
        .update({ ...formattedData })
        .eq('id', editingItemId);
      if (error) throw error;
    } else {
      // Let RLS handle vendor_id attachment from the authenticated user
      const { error } = await supabase
        .from('menu_items')
        .insert([formattedData]);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving menu item:', error);
    throw error;
  }
}

export async function deleteMenuItem(itemId: string) {
  try {
    // Get the item's image URL first
    const { data: item } = await supabase
      .from('menu_items')
      .select('image')
      .eq('id', itemId)
      .single();

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
}
