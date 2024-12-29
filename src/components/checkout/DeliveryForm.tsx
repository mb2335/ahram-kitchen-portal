import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryFormProps {
  deliveryDate: Date;
  notes: string;
  onDateChange: (date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DeliveryForm({ deliveryDate, notes, onDateChange, onNotesChange }: DeliveryFormProps) {
  const { items } = useCart();

  // Fetch categories for date restrictions
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  // Get all unique category IDs from cart items
  const categoryIds = [...new Set(items.map(item => item.category_id).filter(Boolean))];

  // Find the most restrictive date range from all categories in the cart
  const dateRestrictions = categories
    .filter(cat => categoryIds.includes(cat.id))
    .reduce((acc, category) => {
      const from = category.delivery_available_from ? new Date(category.delivery_available_from) : null;
      const until = category.delivery_available_until ? new Date(category.delivery_available_until) : null;

      return {
        earliestStart: !acc.earliestStart || (from && from > acc.earliestStart) ? from : acc.earliestStart,
        latestEnd: !acc.latestEnd || (until && until < acc.latestEnd) ? until : acc.latestEnd,
      };
    }, { earliestStart: null, latestEnd: null } as { earliestStart: Date | null, latestEnd: Date | null });

  // Function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Always disable past dates
    if (date < today) return true;

    // Check category restrictions
    if (dateRestrictions.earliestStart && date < dateRestrictions.earliestStart) return true;
    if (dateRestrictions.latestEnd && date > dateRestrictions.latestEnd) return true;

    return false;
  };

  // Ensure we have a valid date string for the input
  const formatDateForInput = (date: Date) => {
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Delivery Date and Time</Label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={formatDateForInput(deliveryDate)}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate)) {
                onDateChange(selectedDate);
              }
            }}
            min={dateRestrictions.earliestStart ? formatDateForInput(dateRestrictions.earliestStart) : formatDateForInput(new Date())}
            max={dateRestrictions.latestEnd ? formatDateForInput(dateRestrictions.latestEnd) : undefined}
            className="flex-1"
          />
        </div>
        {dateRestrictions.earliestStart && dateRestrictions.latestEnd && (
          <p className="text-sm text-muted-foreground mt-1">
            Delivery available between {format(dateRestrictions.earliestStart, 'PPP')} and {format(dateRestrictions.latestEnd, 'PPP')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Special Instructions (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={onNotesChange}
          placeholder="Any special requests or dietary requirements?"
        />
      </div>
    </div>
  );
}