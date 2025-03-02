
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PickupDetail } from '@/types/pickup';

export interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    delivery_available_from: string | null;
    delivery_available_until: string | null;
    has_custom_pickup: boolean;
    pickup_details: PickupDetail[];
    fulfillment_types: string[];
  };
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  fulfillmentType: string;
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
  fulfillmentType
}: CategoryDeliveryDateProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  
  const fromDate = category.delivery_available_from 
    ? new Date(category.delivery_available_from) 
    : undefined;
  
  const toDate = category.delivery_available_until 
    ? new Date(category.delivery_available_until) 
    : undefined;

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setDate(date);
    onDateChange(date);
  };

  if (fulfillmentType === 'pickup' && category.has_custom_pickup && category.pickup_details?.length > 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">{category.name} Pickup Options</h4>
        <RadioGroup 
          value={selectedPickupDetail ? `${selectedPickupDetail.time}-${selectedPickupDetail.location}` : ''}
          onValueChange={(value) => {
            const [time, location] = value.split('-', 2);
            onPickupDetailChange({ time, location });
          }}
        >
          {category.pickup_details.map((detail, idx) => (
            <div className="flex items-center space-x-2 border p-2 rounded" key={idx}>
              <RadioGroupItem value={`${detail.time}-${detail.location}`} id={`pickup-${category.id}-${idx}`} />
              <Label htmlFor={`pickup-${category.id}-${idx}`} className="flex-1">
                <div className="flex flex-col">
                  <span className="font-medium">{detail.time}</span>
                  <span className="text-sm text-muted-foreground">{detail.location}</span>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  if (fulfillmentType === 'delivery') {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">{category.name} Date</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              disabled={(date) => {
                // Disable dates outside the available range
                return (fromDate && date < fromDate) || (toDate && date > toDate);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return null;
}
