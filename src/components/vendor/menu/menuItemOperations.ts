import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "./types";

export async function updateMenuItemOrder(items: { id: string; order_index: number }[]) {
  const { error } = await supabase
    .from('menu_items')
    .update(items.map(item => ({
      order_index: item.order_index
    })))
    .in('id', items.map(item => item.id));

  if (error) throw error;
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
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}