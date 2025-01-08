import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';
import { PickupDetail } from '@/types/pickup';

interface DeliveryFormProps {
  deliveryDates: Record<string, Date>;
  notes: string;
  onDateChange: (categoryId: string, date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  selectedPickupDetails: Record<string, PickupDetail>;
  onPickupDetailChange: (categoryId: string, pickupDetail: PickupDetail) => void;
}

export function DeliveryForm({ 
  deliveryDates, 
  notes, 
  onDateChange, 
  onNotesChange,
  selectedPickupDetails,
  onPickupDetailChange
}: DeliveryFormProps) {
  const { items } = useCart();

  console.log('[DeliveryForm] Current state:', {
    deliveryDates,
    selectedPickupDetails,
    items
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      console.log('[DeliveryForm] Fetched categories:', data);

      return data.map(category => ({
        id: category.id,
        name: category.name,
        delivery_available_from: category.delivery_available_from,
        delivery_available_until: category.delivery_available_until,
        has_custom_pickup: category.has_custom_pickup,
        pickup_details: (category.pickup_details || []).map((detail: any) => ({
          time: detail.time,
          location: detail.location
        })) as PickupDetail[]
      }));
    },
  });

  const handlePickupDetailChange = (categoryId: string, pickupDetail: PickupDetail) => {
    console.log('[DeliveryForm] Before pickup detail change:', {
      categoryId,
      pickupDetail,
      currentDetails: selectedPickupDetails
    });
    
    onPickupDetailChange(categoryId, pickupDetail);
    
    console.log('[DeliveryForm] After pickup detail change:', {
      categoryId,
      pickupDetail,
      newDetails: { ...selectedPickupDetails, [categoryId]: pickupDetail }
    });
  };

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  console.log('[DeliveryForm] Items by category:', itemsByCategory);

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        itemsByCategory[category.id] && (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={selectedPickupDetails[category.id] ? JSON.stringify(selectedPickupDetails[category.id]) : undefined}
              onPickupDetailChange={(pickupDetail) => handlePickupDetailChange(category.id, pickupDetail)}
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
