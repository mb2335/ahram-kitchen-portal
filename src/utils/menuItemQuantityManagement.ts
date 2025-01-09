import { supabase } from "@/integrations/supabase/client";
import { OrderItem } from "@/types/order";

export async function updateMenuItemQuantities(items: OrderItem[]) {
  for (const item of items) {
    const { data: menuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('quantity_limit')
      .eq('id', item.id)
      .single();

    if (fetchError) continue;

    if (menuItem.quantity_limit !== null) {
      const newQuantity = Math.max(0, menuItem.quantity_limit - item.quantity);
      
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ quantity_limit: newQuantity })
        .eq('id', item.id);

      if (updateError) continue;
    }
  }
}