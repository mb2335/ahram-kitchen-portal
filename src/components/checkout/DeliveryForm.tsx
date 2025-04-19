
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryNotes } from './delivery/DeliveryNotes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FulfillmentSettings } from './fulfillment/FulfillmentSettings';
import { PickupDetail } from '@/types/pickup';
import { DeliveryTimeSlotSelection } from '@/types/delivery';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

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

  // Use the fulfillment types set for tracking what's being used
  const usedFulfillmentTypes = new Set([fulfillmentType]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.fulfillment.title') || "Fulfillment Method"}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={fulfillmentType}
            onValueChange={onFulfillmentTypeChange}
            className="flex flex-col space-y-2 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FULFILLMENT_TYPE_PICKUP} id="pickup" />
              <Label htmlFor="pickup">{t('checkout.fulfillment.pickup') || "Pickup"}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FULFILLMENT_TYPE_DELIVERY} id="delivery" />
              <Label htmlFor="delivery">{t('checkout.fulfillment.delivery') || "Delivery"}</Label>
            </div>
          </RadioGroup>
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

      {fulfillmentType === FULFILLMENT_TYPE_DELIVERY && (
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
