import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PickupDetail } from '@/types/pickup';

interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    delivery_available_from?: string;
    delivery_available_until?: string;
    has_custom_pickup?: boolean;
    pickup_details?: PickupDetail[];
  };
  selectedDate?: Date;
  onDateChange: (date: Date | undefined) => void;
  selectedPickupDetail?: string;
  onPickupDetailChange: (pickupDetail: PickupDetail) => void;
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
}: CategoryDeliveryDateProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateChange(newDate);
    console.log('Date selected for category:', {
      categoryId: category.id,
      date: newDate
    });
  };

  const handlePickupDetailChange = (value: string) => {
    const selectedDetail = category.pickup_details?.find(
      detail => `${detail.time}-${detail.location}` === value
    );
    
    if (selectedDetail) {
      console.log('Pickup detail selected:', {
        categoryId: category.id,
        categoryName: category.name,
        detail: selectedDetail
      });
      onPickupDetailChange(selectedDetail);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <Label>{category.name}</Label>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={(date) => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return date < now;
          }}
          className="rounded-md border"
        />

        {category.has_custom_pickup && category.pickup_details && category.pickup_details.length > 0 && (
          <div className="space-y-2">
            <Label>Pickup Details</Label>
            <Select
              value={selectedPickupDetail}
              onValueChange={handlePickupDetailChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pickup time and location" />
              </SelectTrigger>
              <SelectContent>
                {category.pickup_details.map((detail, index) => (
                  <SelectItem 
                    key={`${detail.time}-${detail.location}`} 
                    value={`${detail.time}-${detail.location}`}
                  >
                    {detail.time} at {detail.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </Card>
  );
}