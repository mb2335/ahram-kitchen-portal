
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
import { supabase } from "@/integrations/supabase/client";
import { useMenuItemReordering } from "@/hooks/menu/useMenuItemReordering";

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemGrid({ items, onEdit, onDelete }: MenuItemGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { handleReorderMenuItems } = useMenuItemReordering();

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
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);

      // Update order indices for all affected items
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        order_index: index + 1,
      }));

      // Handle reordering with instant UI update
      handleReorderMenuItems(reorderedItems);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="space-y-2">
            <h3 className="text-lg font-semibold">{category.name}</h3>
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
          </div>
        ))}

        {itemsByCategory['uncategorized'] && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Uncategorized</h3>
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
          </div>
        )}
      </div>
    </DndContext>
  );
}
