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

export async function loadVendorMenuItems(userId: string) {
  const { data: vendorData } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!vendorData) throw new Error('Vendor not found');

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('vendor_id', vendorData.id)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data;
}

export async function saveMenuItem(
  userId: string,
  menuItemData: Omit<MenuItem, 'id' | 'vendor_id' | 'created_at'>,
  editingItemId?: string
) {
  const { data: vendorData } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!vendorData) throw new Error('Vendor not found');

  if (editingItemId) {
    const { error } = await supabase
      .from('menu_items')
      .update({ ...menuItemData, vendor_id: vendorData.id })
      .eq('id', editingItemId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('menu_items')
      .insert([{ ...menuItemData, vendor_id: vendorData.id }]);
    if (error) throw error;
  }
}

export async function deleteMenuItem(itemId: string) {
  try {
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
