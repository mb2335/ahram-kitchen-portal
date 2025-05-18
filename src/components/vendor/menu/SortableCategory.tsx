
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from '@/components/ui/card';
import { GripVertical } from "lucide-react";
import { Category } from "./types/category";

interface SortableCategoryProps {
  category: Category;
  children: React.ReactNode;
}

export function SortableCategory({ category, children }: SortableCategoryProps) {
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
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden w-full mb-4">
        <div className="absolute left-0 top-0 h-full flex items-center px-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="pl-8">
          {children}
        </div>
      </Card>
    </div>
  );
}
