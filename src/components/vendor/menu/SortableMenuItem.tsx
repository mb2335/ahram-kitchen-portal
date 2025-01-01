import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from "lucide-react";
import { MenuItem } from "./types";

interface SortableMenuItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function SortableMenuItem({ item, onEdit, onDelete }: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getRemainingDisplay = () => {
    if (item.quantity_limit === 0) {
      return 'Sold Out';
    }
    if (item.quantity_limit === null) {
      return 'Unlimited';
    }
    return `${item.quantity_limit} remaining`;
  };

  const getAvailabilityDisplay = () => {
    if (!item.category_id) {
      return 'Uncategorized (Locked)';
    }
    return item.is_available ? 'Available' : 'Unavailable';
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing self-start sm:mt-2"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg"
              />
            )}
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.name_ko && (
                  <p className="text-sm text-gray-600">{item.name_ko}</p>
                )}
              </div>
              
              {(item.description || item.description_ko) && (
                <div className="space-y-1">
                  {item.description && (
                    <p className="text-sm">{item.description}</p>
                  )}
                  {item.description_ko && (
                    <p className="text-sm text-gray-600">{item.description_ko}</p>
                  )}
                </div>
              )}
              
              <p className="text-lg font-medium">${item.price}</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant={item.category_id && item.is_available ? 'default' : 'secondary'}>
                  {getAvailabilityDisplay()}
                </Badge>
                <Badge variant="secondary">
                  {getRemainingDisplay()}
                </Badge>
              </div>
            </div>
            
            <div className="flex sm:flex-col gap-2 self-start mt-4 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(item)}
                className="flex-1 sm:flex-none"
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="flex-1 sm:flex-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}