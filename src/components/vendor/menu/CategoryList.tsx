
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

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
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
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden w-full">
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
      ))}
    </div>
  );
}
