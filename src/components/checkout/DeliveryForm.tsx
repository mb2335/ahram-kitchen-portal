import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DeliveryFormProps {
  deliveryDates: Record<string, Date>;
  notes: string;
  onDateChange: (categoryId: string, date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DeliveryForm({ 
  deliveryDates, 
  notes, 
  onDateChange, 
  onNotesChange 
}: DeliveryFormProps) {
  const { items } = useCart();

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

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const isDateDisabled = (date: Date, category: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true;

    const from = category.delivery_available_from ? new Date(category.delivery_available_from) : null;
    const until = category.delivery_available_until ? new Date(category.delivery_available_until) : null;

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
    <div className="space-y-6">
      {categories.map((category) => (
        itemsByCategory[category.id] && (
          <div key={category.id} className="space-y-4">
            <div>
              <Label className="text-lg font-medium">{category.name}</Label>
              <div className="mt-2 space-y-2">
                <Input
                  type="date"
                  value={deliveryDates[category.id] ? formatDateForInput(deliveryDates[category.id]) : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Create date at noon to avoid timezone issues
                      const selectedDate = new Date(e.target.value + 'T12:00:00');
                      if (!isNaN(selectedDate.getTime()) && !isDateDisabled(selectedDate, category)) {
                        onDateChange(category.id, selectedDate);
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
            <Separator />
          </div>
        )
      ))}

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