import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
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
}

export function CategoryDeliveryDate({ 
  category, 
  selectedDate, 
  onDateChange 
}: CategoryDeliveryDateProps) {
  const [selectedPickup, setSelectedPickup] = useState<PickupDetail | null>(null);

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
        {category.has_custom_pickup ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Select a pickup time and location
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {category.pickup_details.map((pickup, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={selectedPickup === pickup ? "default" : "outline"}
                  className={cn(
                    "w-full text-left",
                    "flex flex-col items-start space-y-1 p-4",
                    selectedPickup === pickup && "ring-2 ring-primary"
                  )}
                  onClick={() => {
                    setSelectedPickup(pickup);
                    // Set the delivery date to today when pickup is selected
                    const today = new Date();
                    today.setHours(12, 0, 0, 0);
                    onDateChange(today);
                  }}
                >
                  <span className="font-medium">{pickup.time}</span>
                  <span className="text-sm text-muted-foreground">{pickup.location}</span>
                </Button>
              ))}
            </div>
            {!selectedPickup && (
              <p className="text-sm text-destructive">Please select a pickup option</p>
            )}
          </div>
        ) : (
          <>
            <Input
              type="date"
              value={selectedDate ? formatDateForInput(selectedDate) : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const selectedDate = new Date(e.target.value + 'T12:00:00');
                  if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                    onDateChange(selectedDate);
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
          </>
        )}
      </div>
    </div>
  );
}