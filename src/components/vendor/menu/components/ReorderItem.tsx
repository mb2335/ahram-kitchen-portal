
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReorderItemType } from './ReorderModal';
import { Card } from '@/components/ui/card';
import { MoveVertical } from 'lucide-react';

interface ReorderItemProps {
  id: string;
  item: ReorderItemType;
}

export function ReorderItem({ id, item }: ReorderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 border flex items-center justify-between cursor-grab active:cursor-grabbing bg-card"
      {...attributes}
      {...listeners}
    >
      <span className="font-medium">{item.name}</span>
      <MoveVertical className="h-5 w-5 text-muted-foreground" />
    </Card>
  );
}
