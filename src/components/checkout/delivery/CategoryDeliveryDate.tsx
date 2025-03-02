
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PickupDetail } from '@/types/pickup';
import { 
  FULFILLMENT_TYPE_PICKUP, 
  FULFILLMENT_TYPE_DELIVERY,
  ERROR_MESSAGES
} from '@/types/order';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    has_custom_pickup: boolean;
    pickup_details: PickupDetail[];
    fulfillment_types: string[];
    blocked_dates: string[];
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Create a set of blocked dates for efficient lookup
  const blockedDatesSet = new Set(category.blocked_dates || []);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if date is valid based on fulfillment type
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && blockedDatesSet.has(dateStr)) {
      setErrorMessage(ERROR_MESSAGES.PICKUP_INVALID_DAY);
      return;
    } else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && !blockedDatesSet.has(dateStr)) {
      setErrorMessage(ERROR_MESSAGES.DELIVERY_INVALID_DAY);
      return;
    }
    
    setErrorMessage(null);
    setDate(date);
    onDateChange(date);
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // For pickup: disable blocked dates
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && blockedDatesSet.has(dateStr)) {
      return true;
    }
    
    // For delivery: disable non-blocked dates (pickup dates)
    if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && !blockedDatesSet.has(dateStr)) {
      return true;
    }
    
    return false;
  };

  if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && category.has_custom_pickup && category.pickup_details?.length > 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">{category.name} Pickup Options</h4>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label>Select pickup date (only on available days)</Label>
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
                disabled={isDateDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {date && (
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
        )}
      </div>
    );
  }

  if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">{category.name} Date</h4>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="mb-4">
          <Label className="mb-1 block">Select delivery date (on non-pickup days)</Label>
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
                disabled={isDateDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  return null;
}
