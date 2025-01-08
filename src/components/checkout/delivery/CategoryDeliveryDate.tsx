import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
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
  selectedPickup?: PickupDetail;
  onPickupChange?: (pickup: PickupDetail | undefined) => void;
}

export function CategoryDeliveryDate({ 
  category, 
  selectedDate, 
  onDateChange,
  selectedPickup,
  onPickupChange 
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

  return (
    <div>
      <Label className="text-lg font-medium">{category.name}</Label>
      <div className="mt-2 space-y-4">
        {category.has_custom_pickup && category.pickup_details && category.pickup_details.length > 0 ? (
          <div className="space-y-3">
            <Label>Select Pickup Option</Label>
            <div className="grid grid-cols-1 gap-2">
              {category.pickup_details.map((pickup, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedPickup === pickup ? "default" : "outline"}
                  className={cn(
                    "w-full justify-start text-left",
                    selectedPickup === pickup && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    if (onPickupChange) {
                      onPickupChange(pickup);
                      // Set delivery date to today when pickup is selected
                      const today = new Date();
                      today.setHours(12, 0, 0, 0);
                      onDateChange(today);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{pickup.time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{pickup.location}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <Input
            type="date"
            value={selectedDate ? formatDateForInput(selectedDate) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const selectedDate = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                  onDateChange(selectedDate);
                  // Clear pickup selection when date is selected
                  if (onPickupChange) {
                    onPickupChange(undefined);
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