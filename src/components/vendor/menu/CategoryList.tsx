
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

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || `Day ${dayIndex}`;
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

              {category.has_custom_pickup && category.pickup_details && (
                <div>
                  <h4 className="font-medium mb-1">Pickup Details</h4>
                  <div className="space-y-1">
                    {category.pickup_details.length > 0 ? (
                      category.pickup_details.map((detail, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-1 text-xs">
                          <Badge variant="outline">{getDayName(detail.day)}</Badge>
                          <span>{detail.time || 'No time specified'}</span>
                          <span>at</span>
                          <span className="font-medium">{detail.location || 'No location specified'}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No pickup details specified</span>
                    )}
                  </div>
                </div>
              )}

              {category.pickup_days && category.pickup_days.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Pickup Days</h4>
                  <div className="flex flex-wrap gap-1">
                    {category.pickup_days.map((day, index) => (
                      <Badge key={index} variant="outline">
                        {getDayName(day)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Only show delivery settings if delivery is a fulfillment type */}
              {category.delivery_settings && category.fulfillment_types && category.fulfillment_types.includes('delivery') && (
                <div>
                  <h4 className="font-medium mb-1">Delivery Settings</h4>
                  <div className="text-xs space-y-1">
                    <div>Time Interval: {category.delivery_settings.time_interval || 'N/A'} minutes</div>
                    <div>Hours: {category.delivery_settings.start_time || 'N/A'} - {category.delivery_settings.end_time || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
