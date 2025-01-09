import { supabase } from "@/integrations/supabase/client";
import { OrderItem } from "@/types/order";

export async function updateMenuItemQuantities(items: OrderItem[]) {
  console.log('Updating menu item quantities:', items);
  
  for (const item of items) {
    const { data: menuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('quantity_limit')
      .eq('id', item.id)
      .single();

    if (fetchError) {
      console.error('Error fetching menu item:', fetchError);
      continue;
    }

    if (menuItem.quantity_limit !== null) {
      // Ensure we don't go below 0
      const newQuantity = Math.max(0, menuItem.quantity_limit - item.quantity);
      
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ quantity_limit: newQuantity })
        .eq('id', item.id);

      if (updateError) {
        console.error('Error updating menu item quantity:', updateError);
        continue;
      }
      
      console.log(`Updated quantity for item ${item.id} to ${newQuantity}`);
    }
  }
}