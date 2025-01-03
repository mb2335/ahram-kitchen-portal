import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';

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

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        itemsByCategory[category.id] && (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
            />
            <Separator />
          </div>
        )
      ))}

      <DeliveryNotes
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
}