
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { GripVertical } from "lucide-react";

interface SortableCategoryProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function SortableCategory({ category, onEdit, onDelete }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden w-full mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div 
                {...attributes} 
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.name_ko}</CardDescription>
              </div>
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
    </div>
  );
}
