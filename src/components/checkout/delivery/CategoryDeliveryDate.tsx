import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    delivery_available_from: string | null;
    delivery_available_until: string | null;
  };
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

export function CategoryDeliveryDate({ 
  category, 
  selectedDate, 
  onDateChange 
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
      <div className="mt-2 space-y-2">
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
      </div>
    </div>
  );
}