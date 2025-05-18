
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical } from "lucide-react";
import { Category } from "./types/category";

interface SortableCategoryProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
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

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mr-3"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold">{category.name}</h3>
            {category.name_ko && (
              <p className="text-sm text-gray-600">{category.name_ko}</p>
            )}
          </div>
          
          <div className="flex gap-2">
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
      </Card>
    </div>
  );
}
