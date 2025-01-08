import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PickupDetail } from '@/components/vendor/menu/types/category';

interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    delivery_available_from: string | null;
    delivery_available_until: string | null;
    has_custom_pickup: boolean;
    pickup_details: PickupDetail[];
  };
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedPickupDetail?: string;
  onPickupDetailChange?: (pickupDetail: string) => void;
}

export function CategoryDeliveryDate({ 
  category, 
  selectedDate, 
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange
}: CategoryDeliveryDateProps) {
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true;

    const from = category.delivery_available_from ? new Date(category.delivery_available_from) : null;
    const until = category.delivery_available_until ? new Date(category.delivery_available_until) : null;

    if (from) from.setHours(12, 0, 0, 0);
    if (until) until.setHours(12, 0, 0, 0);
    date.setHours(12, 0, 0, 0);

    if (from && date < from) return true;
    if (until && date > until) return true;

    return false;
  };

  const formatDateForInput = (date: Date) => {
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return '';
    }
  };

  const pickupDetails = category.pickup_details as PickupDetail[];
  const hasPickupOptions = category.has_custom_pickup && pickupDetails.length > 0;

  return (
    <div className="space-y-4">
      <Label className="text-lg font-medium">{category.name}</Label>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Delivery Date</Label>
          <Input
            type="date"
            value={selectedDate ? formatDateForInput(selectedDate) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const selectedDate = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                  onDateChange(selectedDate);
                  if (onPickupDetailChange) {
                    onPickupDetailChange('');
                  }
                }
              }
            }}
            min={category.delivery_available_from ? formatDateForInput(new Date(category.delivery_available_from)) : formatDateForInput(new Date())}
            max={category.delivery_available_until ? formatDateForInput(new Date(category.delivery_available_until)) : undefined}
            className={cn(
              "flex-1",
              "focus:ring-2 focus:ring-primary",
              "hover:border-primary transition-colors"
            )}
          />
        </div>

        {hasPickupOptions && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-grow border-t border-gray-200" />
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <Label>Pickup Options</Label>
            <RadioGroup
              value={selectedPickupDetail}
              onValueChange={(value) => {
                if (onPickupDetailChange) {
                  onPickupDetailChange(value);
                  onDateChange(undefined);
                }
              }}
              className="grid gap-2"
            >
              {pickupDetails.map((detail, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={`${index}`} id={`pickup-${category.id}-${index}`} />
                  <Label
                    htmlFor={`pickup-${category.id}-${index}`}
                    className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent cursor-pointer w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{detail.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{detail.location}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <div className="text-sm space-y-1">
          {category.delivery_available_from && category.delivery_available_until && (
            <p className="text-muted-foreground">
              Available for delivery between{' '}
              <span className="font-medium text-foreground">
                {format(new Date(category.delivery_available_from), 'MMM d, yyyy')}
              </span>
              {' '}and{' '}
              <span className="font-medium text-foreground">
                {format(new Date(category.delivery_available_until), 'MMM d, yyyy')}
              </span>
              {' '}(inclusive)
            </p>
          )}
          {!category.delivery_available_from && !category.delivery_available_until && (
            <p className="text-muted-foreground">
              Available for delivery starting{' '}
              <span className="font-medium text-foreground">
                {format(new Date(), 'MMM d, yyyy')}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}