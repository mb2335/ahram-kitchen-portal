import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  id: string;
  name: string;
  name_ko?: string;
  description?: string;
  description_ko?: string;
  price: number;
  category: string;
  is_available: boolean;
  image?: string;
}

interface MenuItemGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export function MenuItemGrid({ items, onEdit, onDelete }: MenuItemGridProps) {
  return (
    <div className="grid gap-4 pb-6">
      {items.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex justify-between items-start">
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
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant={item.is_available ? 'default' : 'secondary'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
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
      ))}
    </div>
  );
}