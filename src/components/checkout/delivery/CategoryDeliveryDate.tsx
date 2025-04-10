
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, AlertCircle } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';

export interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    name_ko?: string; // Add Korean name support
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
  allPickupCategories?: Array<{name: string, name_ko?: string}>; // Updated to handle Korean names
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  allPickupCategories = []
}: CategoryDeliveryDateProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t, language } = useLanguage();
  
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
    
    // Ensure we pass a valid Date object to the parent
    onDateChange(cleanDate);
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
      // Use language-appropriate category names
      const categoryNames = allPickupCategories
        .map(cat => language === 'en' ? cat.name : cat.name_ko || cat.name)
        .join(' & ');
      return `${categoryNames} ${t('checkout.pickup.title')}`;
    }
    const categoryName = language === 'en' ? category.name : category.name_ko || category.name;
    return `${categoryName} ${t('checkout.pickup.options')}`;
  };

  if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && category.has_custom_pickup && category.pickup_details?.length > 0) {
    return (
      <div className="space-y-4">
        <h4 className="font-medium">{generatePickupHeading()}</h4>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label>{t('checkout.date')}</Label>
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
                {selectedDate ? format(selectedDate, "PPP") : <span>{t('checkout.date.select')}</span>}
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
            onValueChange={(value) => {
              const [time, location] = value.split('-', 2);
              // Fix: Include day property when creating PickupDetail
              const dayOfWeek = selectedDate ? selectedDate.getDay() : 0;
              onPickupDetailChange({ day: dayOfWeek, time, location });
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
        <h4 className="font-medium">
          {language === 'en' ? category.name : category.name_ko || category.name} {t('checkout.date')}
        </h4>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="mb-4">
          <Label className="mb-1 block">{t('checkout.date')}</Label>
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
                {selectedDate ? format(selectedDate, "PPP") : <span>{t('checkout.date.select')}</span>}
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
