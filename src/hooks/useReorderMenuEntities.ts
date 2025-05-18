
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MenuItem } from '@/components/vendor/menu/types';
import { Category } from '@/components/vendor/menu/types/category';

type EntityType = 'menu_items' | 'menu_categories';

interface ReorderableEntity {
  id: string;
  order_index: number;
  category_id?: string;
}

export function useReorderMenuEntities<T extends ReorderableEntity>(
  entityType: EntityType,
  entityQueryKey: string | string[], 
  onSuccessCallback?: () => void
) {
  const queryClient = useQueryClient();
  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async (entities: T[], categoryId?: string) => {
    if (!entities.length) return;
    
    try {
      setIsReordering(true);

      // Create an array of updates with id and new order_index
      const updatePayload = entities.map((entity, index) => ({
        id: entity.id,
        order_index: index + 1
      }));

      console.log(`Reordering ${entityType}:`, updatePayload);
      
      // Update each entity's order index one by one to avoid transaction issues
      for (const item of updatePayload) {
        let query = supabase
          .from(entityType)
          .update({ order_index: item.order_index })
          .eq('id', item.id);
          
        if (categoryId && entityType === 'menu_items') {
          query = query.eq('category_id', categoryId);
        }
          
        const { error } = await query;

        if (error) {
          console.error(`Error updating ${entityType} order:`, error);
          throw error;
        }
      }
      
      // No need to invalidate queries here as the real-time hook will handle it
      // Just show a toast notification
      toast({
        title: entityType === 'menu_categories' ? "Categories reordered" : "Menu items reordered",
        description: "The new order has been saved",
      });
      
      if (onSuccessCallback) {
        onSuccessCallback();
      }
      
      return true;
    } catch (error) {
      console.error(`Error reordering ${entityType}:`, error);
      toast({
        title: "Error",
        description: `Failed to update the order of ${entityType === 'menu_categories' ? 'categories' : 'menu items'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsReordering(false);
    }
  };

  return {
    handleReorder,
    isReordering
  };
}
