
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';
import { PickupDetail } from '@/types/pickup';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

interface DeliveryFormProps {
  deliveryDates: Record<string, Date>;
  notes: string;
  onDateChange: (categoryId: string, date: Date) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  pickupDetail: PickupDetail | null;
  onPickupDetailChange: (pickupDetail: PickupDetail) => void;
  fulfillmentType: string;
  onFulfillmentTypeChange: (type: string) => void;
}

export function DeliveryForm({ 
  deliveryDates, 
  notes, 
  onDateChange, 
  onNotesChange,
  pickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  onFulfillmentTypeChange
}: DeliveryFormProps) {
  const { items } = useCart();
  const [availableFulfillmentTypes, setAvailableFulfillmentTypes] = useState<string[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data.map(category => ({
        id: category.id,
        name: category.name,
        delivery_available_from: category.delivery_available_from,
        delivery_available_until: category.delivery_available_until,
        has_custom_pickup: category.has_custom_pickup,
        pickup_details: (category.pickup_details || []).map((detail: any) => ({
          time: detail.time,
          location: detail.location
        })),
        fulfillment_types: category.fulfillment_types || []
      }));
    },
  });

  // Calculate available fulfillment types across all categories
  useEffect(() => {
    if (!categories.length) return;
    
    const fulfillmentTypes = new Set<string>();
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    
    categories.forEach(category => {
      if (itemCategoryIds.includes(category.id)) {
        category.fulfillment_types?.forEach(type => fulfillmentTypes.add(type));
      }
    });
    
    const availableTypes = Array.from(fulfillmentTypes);
    setAvailableFulfillmentTypes(availableTypes);
    
    // Set default fulfillment type if none selected and options available
    if (!fulfillmentType && availableTypes.length > 0) {
      onFulfillmentTypeChange(availableTypes[0]);
    }
  }, [categories, items, fulfillmentType, onFulfillmentTypeChange]);

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
      {availableFulfillmentTypes.length > 1 && (
        <div className="space-y-4">
          <h3 className="font-medium">Fulfillment Method</h3>
          <RadioGroup 
            value={fulfillmentType} 
            onValueChange={onFulfillmentTypeChange}
            className="flex flex-col space-y-2"
          >
            {availableFulfillmentTypes.includes('delivery') && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">Delivery</Label>
              </div>
            )}
            {availableFulfillmentTypes.includes('pickup') && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup">Pickup</Label>
              </div>
            )}
          </RadioGroup>
          <Separator />
        </div>
      )}

      {/* Only show relevant categories based on selected fulfillment type */}
      {categories.map((category) => {
        // Skip categories that don't match the selected fulfillment type
        if (!category.fulfillment_types?.includes(fulfillmentType)) return null;
        
        // Skip categories with no items
        if (!itemsByCategory[category.id]) return null;
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={fulfillmentType === 'pickup' ? pickupDetail : null}
              onPickupDetailChange={onPickupDetailChange}
              fulfillmentType={fulfillmentType}
            />
            <Separator />
          </div>
        );
      })}

      <DeliveryNotes
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
}
