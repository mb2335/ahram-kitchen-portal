import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MapPin, Clock } from 'lucide-react';
import { PickupDetail } from '@/types/pickup';

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
  onPickupDetailChange?: (pickupDetail: PickupDetail) => void;
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

  const handlePickupDetailSelection = (detail: PickupDetail) => {
    console.log('Pickup detail selected:', {
      categoryId: category.id,
      categoryName: category.name,
      detail
    });
    onPickupDetailChange?.(detail);
  };

  const pickupDetails = category.pickup_details as PickupDetail[];
  const hasPickupOptions = category.has_custom_pickup && pickupDetails.length > 0;

  return (
    <div className="space-y-4">
      <Label className="text-lg font-medium">{category.name}</Label>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Pickup Date</Label>
          <Input
            type="date"
            value={selectedDate ? formatDateForInput(selectedDate) : ''}
            onChange={(e) => {
              if (e.target.value) {
                const selectedDate = new Date(e.target.value + 'T12:00:00');
                if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                  console.log('Date selected for category:', {
                    categoryId: category.id,
                    date: selectedDate
                  });
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
        </div>

        {hasPickupOptions && (
          <div className="space-y-2">
            <Label>Pickup Location & Time</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {pickupDetails.map((detail, index) => (
                <div
                  key={index}
                  onClick={() => handlePickupDetailSelection(detail)}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg border text-left transition-all cursor-pointer",
                    "hover:border-primary hover:bg-accent",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    selectedPickupDetail === JSON.stringify(detail)
                      ? "border-primary bg-accent shadow-sm" 
                      : "border-input"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{detail.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{detail.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm space-y-1">
          {category.delivery_available_from && category.delivery_available_until && (
            <p className="text-muted-foreground">
              Available for pickup between{' '}
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
              Available for pickup starting{' '}
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