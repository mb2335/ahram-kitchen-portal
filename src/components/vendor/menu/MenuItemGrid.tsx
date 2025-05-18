
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

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onReorder: (items: MenuItem[]) => void;
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find the category of the dragged item
      const draggedItem = items.find(item => item.id === active.id);
      if (!draggedItem) return;
      
      // Get all items in the same category
      const categoryItems = items.filter(
        item => item.category_id === draggedItem.category_id
      );
      
      const oldIndex = categoryItems.findIndex(item => item.id === active.id);
      const newIndex = categoryItems.findIndex(item => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return;
      
      // Create a new array with the item moved to the new position
      const reorderedCategoryItems = [...categoryItems];
      const [movedItem] = reorderedCategoryItems.splice(oldIndex, 1);
      reorderedCategoryItems.splice(newIndex, 0, movedItem);
      
      // Update order indices for the reordered category items
      const updatedCategoryItems = reorderedCategoryItems.map((item, index) => ({
        ...item,
        order_index: index + 1,
      }));
      
      // Combine with items from other categories that weren't affected
      const otherItems = items.filter(
        item => item.category_id !== draggedItem.category_id
      );
      
      const allUpdatedItems = [...updatedCategoryItems, ...otherItems];
      
      // Call the onReorder callback with the updated items
      onReorder(updatedCategoryItems);
    }
  }

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
      {categories.map((category) => (
        <div key={category.id} className="space-y-2">
          <h3 className="text-lg font-semibold">{category.name}</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemsByCategory[category.id] || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {(itemsByCategory[category.id] || []).map((item) => (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ))}

      {itemsByCategory['uncategorized'] && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Uncategorized</h3>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itemsByCategory['uncategorized']}
              strategy={verticalListSortingStrategy}
            >
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
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
