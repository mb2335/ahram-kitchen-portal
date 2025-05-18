
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Category } from './types/category';
import { Badge } from '@/components/ui/badge';
import { SortableCategory } from './SortableCategory';
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
import { updateCategoryOrder, prepareReorderedCategories } from './utils/categoryReordering';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onReorder?: (categories: Category[]) => void;
}

export function CategoryList({ 
  categories, 
  onEdit, 
  onDelete,
  onReorder 
}: CategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getFulfillmentTypeLabel = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'Delivery';
      case 'pickup':
        return 'Pickup';
      default:
        return type;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      const reorderedCategories = prepareReorderedCategories(categories, oldIndex, newIndex);
      
      // Update the order in the database
      updateCategoryOrder(reorderedCategories)
        .then(() => {
          // If onReorder is provided, call it with the updated categories
          if (onReorder) {
            onReorder(reorderedCategories);
          }
        })
        .catch(error => {
          console.error("Failed to update category order:", error);
        });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {categories.map((category) => (
            <SortableCategory key={category.id} category={category}>
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>{category.name_ko}</CardDescription>
                    </div>
                    <div className="space-x-2 flex">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(category)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => onDelete(category.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 text-sm">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-1">Fulfillment Types</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.fulfillment_types?.map((type, index) => (
                          <Badge key={index} variant="secondary">
                            {getFulfillmentTypeLabel(type)}
                          </Badge>
                        ))}
                        {(!category.fulfillment_types || category.fulfillment_types.length === 0) && (
                          <span className="text-muted-foreground">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SortableCategory>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
