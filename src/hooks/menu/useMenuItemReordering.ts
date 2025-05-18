
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/components/vendor/menu/types";

export const useMenuItemReordering = () => {
  const queryClient = useQueryClient();
  const [isReordering, setIsReordering] = useState(false);

  const handleReorderMenuItems = async (items: MenuItem[]) => {
    try {
      setIsReordering(true);
      
      // Optimistic UI update - update the query cache immediately
      queryClient.setQueryData(['menu-items'], items);
      
      // Prepare update payload with minimal data
      const updatePayload = items.map((item) => ({
        id: item.id,
        order_index: item.order_index
      }));
      
      // Send updates to the database
      const promises = updatePayload.map(item => 
        supabase
          .from('menu_items')
          .update({ order_index: item.order_index })
          .eq('id', item.id)
      );
      
      await Promise.all(promises);
      
      // Toast success notification
      toast({
        title: "Success",
        description: "Menu item order updated",
      });
    } catch (error) {
      console.error('Error reordering menu items:', error);
      
      // Toast error notification
      toast({
        title: "Error",
        description: "Failed to update menu item order",
        variant: "destructive",
      });
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    } finally {
      setIsReordering(false);
    }
  };

  return {
    isReordering,
    handleReorderMenuItems
  };
};
