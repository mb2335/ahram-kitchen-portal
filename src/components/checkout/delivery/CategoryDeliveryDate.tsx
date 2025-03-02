
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { PickupDetail } from '@/types/pickup';

interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    pickup_days?: number[];
    has_custom_pickup?: boolean;
    pickup_details?: { time: string; location: string }[];
  };
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  fulfillmentType: string;
  allPickupCategories: string[];
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  allPickupCategories
}: CategoryDeliveryDateProps) {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);
  const [pickupTime, setPickupTime] = useState<string | undefined>(selectedPickupDetail?.time);
  const [pickupLocation, setPickupLocation] = useState<string | undefined>(selectedPickupDetail?.location);
  const [error, setError] = useState<string | null>(null);

  // Generate heading text based on fulfillment type and categories
  const generateHeading = () => {
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      return `${category.name} Pickup Date`;
    }
    return `${category.name} Delivery Date`;
  };

  // Generate pickup details heading
  const generatePickupHeading = () => {
    if (allPickupCategories.length === 1) {
      return 'Pickup Details';
    }
    
    const categoryNames = allPickupCategories.length > 2
      ? 'Multiple Categories'
      : allPickupCategories.join(' & ');
      
    return `${categoryNames} Pickup Details`;
  };

  // Check if a day is a pickup day
  const isPickupDay = (day: Date) => {
    return category.pickup_days?.includes(day.getDay()) || false;
  };

  // Set the initial pickup detail if not yet selected
  useEffect(() => {
    if (
      fulfillmentType === FULFILLMENT_TYPE_PICKUP &&
      category.has_custom_pickup &&
      category.pickup_details?.length &&
      !selectedPickupDetail
    ) {
      // Default to the first available pickup detail
      onPickupDetailChange({
        time: category.pickup_details[0].time,
        location: category.pickup_details[0].location
      });
    }
  }, [fulfillmentType, category, selectedPickupDetail, onPickupDetailChange]);

  // Update parent component when pickup time or location changes
  useEffect(() => {
    if (pickupTime && pickupLocation) {
      onPickupDetailChange({
        time: pickupTime,
        location: pickupLocation
      });
    }
  }, [pickupTime, pickupLocation, onPickupDetailChange]);

  // Handle date selection
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    setDate(selectedDate);
    
    // Check if the selected date is valid for the current fulfillment type
    const isSelectedDatePickupDay = isPickupDay(selectedDate);
    
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && !isSelectedDatePickupDay) {
      setError(`Pickup is only available on designated pickup days for ${category.name}.`);
      return;
    } else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && isSelectedDatePickupDay) {
      setError(`Delivery is not available on pickup days for ${category.name}.`);
      return;
    }
    
    setError(null);
    onDateChange(selectedDate);
  };

  // Function to determine if a date should be disabled
  const isDateDisabled = (date: Date) => {
    const isPickupDayValue = isPickupDay(date);
    
    // If it's a pickup fulfillment, only allow pickup days
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      return !isPickupDayValue;
    }
    
    // If it's a delivery fulfillment, don't allow pickup days
    if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
      return isPickupDayValue;
    }
    
    return false;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">{generateHeading()}</h3>
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-gray-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : `Select ${fulfillmentType === FULFILLMENT_TYPE_PICKUP ? 'Pickup' : 'Delivery'} Date`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => 
                  date < new Date() || // Past dates
                  isDateDisabled(date)  // Dates that don't match the fulfillment type
                }
              />
            </PopoverContent>
          </Popover>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {fulfillmentType === FULFILLMENT_TYPE_PICKUP && category.has_custom_pickup && (
        <div className="border p-4 rounded-md space-y-4">
          <h3 className="font-medium">{generatePickupHeading()}</h3>
          
          {category.pickup_details && category.pickup_details.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup-time">Pickup Time</Label>
                <Select
                  value={pickupTime}
                  onValueChange={setPickupTime}
                >
                  <SelectTrigger id="pickup-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(category.pickup_details.map(detail => detail.time))).map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pickup-location">Pickup Location</Label>
                <Select
                  value={pickupLocation}
                  onValueChange={setPickupLocation}
                >
                  <SelectTrigger id="pickup-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set(
                        category.pickup_details
                          .filter(detail => !pickupTime || detail.time === pickupTime)
                          .map(detail => detail.location)
                      )
                    ).map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No pickup details available for this category. Please contact the vendor.</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
