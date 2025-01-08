import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';
import { PickupDetail } from '@/components/vendor/menu/types/category';

interface DeliveryFormProps {
  deliveryDates: Record<string, Date>;
  notes: string;
  onDateChange: (categoryId: string, date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  pickupDetails: Record<string, PickupDetail>;
  onPickupDetailChange: (categoryId: string, detail: PickupDetail) => void;
}

export function DeliveryForm({ 
  deliveryDates, 
  notes, 
  onDateChange, 
  onNotesChange,
  pickupDetails,
  onPickupDetailChange
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
              category={{
                id: category.id,
                name: category.name,
                delivery_available_from: category.delivery_available_from,
                delivery_available_until: category.delivery_available_until,
                has_custom_pickup: category.has_custom_pickup,
                pickup_details: category.pickup_details as PickupDetail[]
              }}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={pickupDetails[category.id]}
              onPickupDetailChange={(detail) => onPickupDetailChange(category.id, detail)}
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