import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Clock, MapPin } from 'lucide-react';
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
  selectedPickupDetail?: PickupDetail;
  onPickupDetailChange?: (detail: PickupDetail) => void;
}

export function CategoryDeliveryDate({ 
  category, 
  selectedDate, 
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange
}: CategoryDeliveryDateProps) {
  const [error, setError] = useState<string | null>(null);

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

  const handlePickupSelection = (detail: PickupDetail) => {
    if (onPickupDetailChange) {
      onPickupDetailChange(detail);
      setError(null);
      // Set delivery date to today for pickup options
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      onDateChange(today);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-lg font-medium">{category.name}</Label>
      
      {category.has_custom_pickup && category.pickup_details.length > 0 ? (
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground">Select a pickup option:</Label>
          <div className="grid grid-cols-1 gap-3">
            {category.pickup_details.map((detail, index) => (
              <Button
                key={index}
                type="button"
                variant={selectedPickupDetail === detail ? "default" : "outline"}
                className={cn(
                  "w-full justify-start space-x-3 text-left",
                  selectedPickupDetail === detail && "ring-2 ring-primary"
                )}
                onClick={() => handlePickupSelection(detail)}
              >
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4" />
                  <span>{detail.time}</span>
                  <MapPin className="h-4 w-4 ml-2" />
                  <span>{detail.location}</span>
                </div>
              </Button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="date"
            value={selectedDate ? formatDateForInput(selectedDate) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const selectedDate = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                  onDateChange(selectedDate);
                  setError(null);
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
        </div>
      )}
    </div>
  );
}