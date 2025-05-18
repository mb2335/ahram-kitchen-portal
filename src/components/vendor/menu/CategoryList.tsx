
import { 
  DndContext, 
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter, 
  useSensor, 
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { SortableCategory } from './SortableCategory';
import { Category } from './types/category';
import { updateCategoryOrder } from './utils/categoryReordering';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((category) => category.id === active.id);
      const newIndex = categories.findIndex((category) => category.id === over.id);

      const newCategories = [...categories];
      const [movedCategory] = newCategories.splice(oldIndex, 1);
      newCategories.splice(newIndex, 0, movedCategory);

      // Update order_index for each category
      const updatedCategories = newCategories.map((category, index) => ({
        ...category,
        order_index: index + 1,
      }));

      // Save the new order to the database
      updateCategoryOrder(
        updatedCategories.map(cat => ({ id: cat.id, order_index: cat.order_index }))
      );
    }
  }

  if (categories.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        No categories found. Create a category to organize your menu items.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => (
            <SortableCategory
              key={category.id}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
