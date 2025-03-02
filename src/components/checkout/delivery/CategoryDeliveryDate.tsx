
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PickupDetail } from '@/types/pickup';
import { 
  FULFILLMENT_TYPE_PICKUP, 
  FULFILLMENT_TYPE_DELIVERY,
  ERROR_MESSAGES
} from '@/types/order';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    has_custom_pickup: boolean;
    pickup_details: PickupDetail[];
    fulfillment_types: string[];
    pickup_days: number[]; // Days of week for pickup (0=Sunday, 1=Monday, etc.)
  };
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  fulfillmentType: string;
  allPickupCategories?: string[]; // For all categories being picked up
  isFirstPickupCategory?: boolean;
  onApplyToAllPickup?: (date: Date, pickupDetail: PickupDetail) => void;
  hasMultiplePickupCategories?: boolean;
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  allPickupCategories = [],
  isFirstPickupCategory = false,
  onApplyToAllPickup,
  hasMultiplePickupCategories = false
}: CategoryDeliveryDateProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  
  // Auto-select the first pickup detail if none is selected and we're in pickup mode
  useEffect(() => {
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && 
        category.has_custom_pickup && 
        category.pickup_details?.length > 0 && 
        !selectedPickupDetail && 
        selectedDate) {
      onPickupDetailChange(category.pickup_details[0]);
    }
  }, [fulfillmentType, category, selectedPickupDetail, selectedDate, onPickupDetailChange]);

  // When date or pickup detail changes and applyToAll is selected, propagate to all pickup categories
  useEffect(() => {
    if (applyToAll && isFirstPickupCategory && onApplyToAllPickup && selectedDate && selectedPickupDetail) {
      onApplyToAllPickup(selectedDate, selectedPickupDetail);
    }
  }, [applyToAll, selectedDate, selectedPickupDetail, isFirstPickupCategory, onApplyToAllPickup]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Ensure we're working with a clean Date object
    const cleanDate = new Date(date.getTime());
    
    const dayOfWeek = cleanDate.getDay(); // 0=Sunday, 1=Monday, etc.
    const isPickupDay = Array.isArray(category.pickup_days) && category.pickup_days.includes(dayOfWeek);
    
    // Check if date is valid based on fulfillment type
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
      setErrorMessage(ERROR_MESSAGES.PICKUP_INVALID_DAY);
      return;
    } else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
      setErrorMessage(ERROR_MESSAGES.DELIVERY_INVALID_DAY);
      return;
    }
    
    setErrorMessage(null);
    
    // Log for debugging
    console.log(`Selected date for category ${category.id}:`, cleanDate);
    console.log(`Selected date is Date instance:`, cleanDate instanceof Date);
    
    // Ensure we pass a valid Date object to the parent
    onDateChange(cleanDate);
  };

  const handlePickupDetailChange = (value: string) => {
    const [time, location] = value.split('-', 2);
    const newDetail = { time, location };
    onPickupDetailChange(newDetail);
  };

  const isDateDisabled = (date: Date) => {
    if (!category.pickup_days || !Array.isArray(category.pickup_days)) return false;
    
    const dayOfWeek = date.getDay();
    const isPickupDay = category.pickup_days.includes(dayOfWeek);
    
    // For pickup: disable non-pickup days
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && !isPickupDay) {
      return true;
    }
    
    // For delivery: disable pickup days
    if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY && isPickupDay) {
      return true;
    }
    
    return false;
  };

  // Generate the dynamic heading text for pickup
  const generatePickupHeading = () => {
    if (allPickupCategories && allPickupCategories.length > 0) {
      const categoryNames = allPickupCategories.join(' & ');
      return `${categoryNames} Pickup Details`;
    }
    return `${category.name} Pickup Options`;
  };

  if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && category.has_custom_pickup && category.pickup_details?.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{generatePickupHeading()}</h4>
          
          {isFirstPickupCategory && hasMultiplePickupCategories && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="apply-to-all" 
                      checked={applyToAll}
                      onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
                    />
                    <Label htmlFor="apply-to-all" className="text-sm cursor-pointer flex items-center">
                      <span>Apply to all pickup items</span>
                      <Share2 className="h-3.5 w-3.5 ml-1" />
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use the same pickup date and details for all items being picked up</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                disabled={isDateDisabled}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {(selectedDate || fulfillmentType === FULFILLMENT_TYPE_PICKUP) && (
          <RadioGroup 
            value={selectedPickupDetail ? `${selectedPickupDetail.time}-${selectedPickupDetail.location}` : ''}
            onValueChange={handlePickupDetailChange}
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
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
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
