
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableMenuItem } from "./SortableMenuItem";
import { MenuItem } from "./types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onReorder: (categoryId: string | null) => void;
}

export function MenuItemGrid({ items, onEdit, onDelete, onReorder }: MenuItemGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryItems = itemsByCategory[category.id] || [];
        return categoryItems.length > 0 ? (
          <div key={category.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{category.name}</h3>
              {categoryItems.length > 1 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onReorder(category.id)}
                >
                  Reorder Items
                </Button>
              )}
            </div>
            <div className="grid gap-4">
              {categoryItems.map((item) => (
                <SortableMenuItem
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ) : null;
      })}

      {itemsByCategory['uncategorized'] && itemsByCategory['uncategorized'].length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Uncategorized</h3>
            {itemsByCategory['uncategorized'].length > 1 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onReorder(null)}
              >
                Reorder Items
              </Button>
            )}
          </div>
          <div className="grid gap-4">
            {itemsByCategory['uncategorized'].map((item) => (
              <SortableMenuItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
