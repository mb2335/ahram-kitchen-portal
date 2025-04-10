
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ArrowUpDown, Clock } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Category } from "./types/category";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from "@/types/order";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onManageTimeSlots: (category: Category) => void;
}

export function CategoryList({ categories, onEdit, onDelete, onManageTimeSlots }: CategoryListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      
      if (oldIndex >= 0 && newIndex >= 0) {
        const reorderedCategories = [...categories];
        const [movedCategory] = reorderedCategories.splice(oldIndex, 1);
        reorderedCategories.splice(newIndex, 0, movedCategory);
        
        // Update order indices and save to database
        try {
          await Promise.all(
            reorderedCategories.map((category, index) => 
              supabase
                .from('menu_categories')
                .update({ order_index: index })
                .eq('id', category.id)
            )
          );
          
          toast({
            title: "Categories Reordered",
            description: "Category order has been updated successfully"
          });
          
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to reorder categories",
            variant: "destructive"
          });
        }
      }
    }
  };

  if (!categories.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No categories found. Add your first category to get started.</p>
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={categories.map(cat => cat.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {categories.map(category => {
            const displayName = language === 'en' ? category.name : category.name_ko;
            
            return (
              <Card key={category.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="cursor-grab">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-medium">{displayName}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) && (
                        <Badge variant="outline">Delivery</Badge>
                      )}
                      {category.fulfillment_types.includes(FULFILLMENT_TYPE_PICKUP) && (
                        <Badge variant="outline">Pickup</Badge>
                      )}
                      {category.has_custom_pickup && (
                        <Badge variant="outline">Custom Pickup</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onManageTimeSlots(category)}
                      title="Manage Delivery Time Slots"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
