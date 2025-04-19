import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FulfillmentSettings } from './fulfillment/FulfillmentSettings';

interface DeliveryFormProps {
  deliveryDates: Record<string, Date>;
  notes: string;
  onDateChange: (categoryId: string, date: Date) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  pickupDetail: PickupDetail | null;
  onPickupDetailChange: (pickupDetail: PickupDetail) => void;
  fulfillmentType: string;
  onFulfillmentTypeChange: (type: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
  categoryFulfillmentTypes: Record<string, string>;
  onCategoryFulfillmentTypeChange: (categoryId: string, type: string) => void;
  deliveryTimeSlotSelections?: Record<string, DeliveryTimeSlotSelection>;
  onDeliveryTimeSlotSelectionChange?: (categoryId: string, selection: DeliveryTimeSlotSelection) => void;
}

export function DeliveryForm({
  deliveryDates,
  notes,
  onDateChange,
  onNotesChange,
  pickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  onFulfillmentTypeChange,
  deliveryAddress,
  onDeliveryAddressChange,
  categoryFulfillmentTypes,
  onCategoryFulfillmentTypeChange,
  deliveryTimeSlotSelections = {},
  onDeliveryTimeSlotSelectionChange
}: DeliveryFormProps) {
  const { items } = useCart();
  const { t } = useLanguage();

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

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const usedFulfillmentTypes = new Set(
    Object.values(categoryFulfillmentTypes)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.categories.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map((category) => {
            if (!itemsByCategory[category.id]) return null;
            const availableTypes = category.fulfillment_types || [];
            const currentType = categoryFulfillmentTypes[category.id] || fulfillmentType;
            
            return (
              <CategoryDeliveryDate
                key={category.id}
                category={category}
                selectedFulfillmentType={currentType}
                onFulfillmentTypeChange={(type) => onCategoryFulfillmentTypeChange(category.id, type)}
                isDisabled={availableTypes.length === 1}
              />
            );
          })}
        </CardContent>
      </Card>

      <FulfillmentSettings
        selectedDates={deliveryDates}
        onDateChange={onDateChange}
        onPickupDetailChange={onPickupDetailChange}
        selectedPickupDetail={pickupDetail}
        onDeliveryTimeSlotChange={(timeSlot) => 
          onDeliveryTimeSlotSelectionChange && 
          onDeliveryTimeSlotSelectionChange('global', {
            categoryId: 'global',
            date: deliveryDates[FULFILLMENT_TYPE_DELIVERY],
            timeSlot
          })
        }
        selectedTimeSlot={deliveryTimeSlotSelections?.global?.timeSlot || null}
        usedFulfillmentTypes={usedFulfillmentTypes}
      />

      {usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY) && (
        <div className="space-y-2">
          <Label htmlFor="delivery-address">{t('checkout.delivery.address')}</Label>
          <Input 
            id="delivery-address"
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            placeholder={t('checkout.delivery.address.placeholder')}
            className="w-full"
            required
          />
        </div>
      )}

      <DeliveryNotes
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
}
