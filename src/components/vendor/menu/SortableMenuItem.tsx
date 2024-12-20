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

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-2"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                {item.name_ko && <p className="text-sm text-gray-600">{item.name_ko}</p>}
                {item.description && <p className="text-sm mt-1">{item.description}</p>}
                {item.description_ko && <p className="text-sm text-gray-600">{item.description_ko}</p>}
                <p className="mt-2">${item.price}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={item.is_available ? 'default' : 'secondary'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                  <Badge variant="secondary">
                    Limit: {item.quantity_limit}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}