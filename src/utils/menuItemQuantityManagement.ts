
import { supabase } from "@/integrations/supabase/client";
import { OrderItem } from "@/types/order";

export async function updateMenuItemQuantities(items: OrderItem[]) {
  console.log(`Updating quantities for ${items.length} items`);
  
  for (const item of items) {
    try {
      const { data: menuItem, error: fetchError } = await supabase
        .from('menu_items')
        .select('quantity_limit')
        .eq('id', item.id)
        .single();

      if (fetchError) {
        console.warn(`Error fetching quantity for item ${item.id}:`, fetchError);
        continue;
      }

      // Only update if there's a limit set
      if (menuItem.quantity_limit !== null) {
        const newQuantity = Math.max(0, menuItem.quantity_limit - item.quantity);
        console.log(`Updating quantity for item ${item.id} from ${menuItem.quantity_limit} to ${newQuantity}`);
        
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ quantity_limit: newQuantity })
          .eq('id', item.id);

        if (updateError) {
          console.warn(`Error updating quantity for item ${item.id}:`, updateError);
        }
      } else {
        console.log(`Item ${item.id} has no quantity limit, skipping update`);
      }
    } catch (err) {
      console.warn(`Exception updating quantity for item ${item.id}:`, err);
      // Continue with other items
    }
  }
}
