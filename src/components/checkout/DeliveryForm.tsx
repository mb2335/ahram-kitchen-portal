
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategoryDeliverySettings } from './delivery/CategoryDeliverySettings';
import { DeliveryTimeSlotSelection } from '@/types/delivery';

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
  const { t, language } = useLanguage();
  const [availableFulfillmentTypes, setAvailableFulfillmentTypes] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasPickupOnlyCategories, setHasPickupOnlyCategories] = useState(false);

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

  const { data: pickupSettings = [] } = useQuery({
    queryKey: ['pickup-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .order('day');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: deliverySettings } = useQuery({
    queryKey: ['delivery-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const pickupDetailsByDay = pickupSettings.reduce((acc, setting) => {
    if (!acc[setting.day]) {
      acc[setting.day] = [];
    }
    acc[setting.day].push({
      day: setting.day,
      time: setting.time,
      location: setting.location
    });
    return acc;
  }, {} as Record<number, PickupDetail[]>);

  useEffect(() => {
    if (!categories.length) return;
    
    const fulfillmentTypes = new Set<string>();
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    let hasPickupOnly = false;
    
    categories.forEach(category => {
      if (itemCategoryIds.includes(category.id)) {
        category.fulfillment_types?.forEach(type => fulfillmentTypes.add(type));
        
        if (category.fulfillment_types?.length === 1 && 
            category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
          hasPickupOnly = true;
        }
      }
    });
    
    setHasPickupOnlyCategories(hasPickupOnly);
    setAvailableFulfillmentTypes(Array.from(fulfillmentTypes));
  }, [categories, items]);

  const needsDeliveryAddress = Object.values(categoryFulfillmentTypes).some(
    type => type === FULFILLMENT_TYPE_DELIVERY
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">{t('checkout.fulfillment')}</h3>
        <RadioGroup 
          value={fulfillmentType} 
          onValueChange={onFulfillmentTypeChange}
          className="flex flex-col space-y-2"
        >
          {availableFulfillmentTypes.includes(FULFILLMENT_TYPE_DELIVERY) && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FULFILLMENT_TYPE_DELIVERY} id={FULFILLMENT_TYPE_DELIVERY} />
              <Label htmlFor={FULFILLMENT_TYPE_DELIVERY}>{t('checkout.fulfillment.delivery')}</Label>
            </div>
          )}
          {availableFulfillmentTypes.includes(FULFILLMENT_TYPE_PICKUP) && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={FULFILLMENT_TYPE_PICKUP} id={FULFILLMENT_TYPE_PICKUP} />
              <Label htmlFor={FULFILLMENT_TYPE_PICKUP}>{t('checkout.fulfillment.pickup')}</Label>
            </div>
          )}
        </RadioGroup>
      </div>

      {warning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {categories.map((category) => {
        if (!itemsByCategory[category.id]) return null;

        const availableTypes = category.fulfillment_types || [];
        const currentType = categoryFulfillmentTypes[category.id] || fulfillmentType;
        
        return (
          <div key={category.id} className="space-y-4 border p-4 rounded-lg">
            <div>
              <h4 className="font-medium">
                {language === 'en' ? category.name : category.name_ko || category.name}
              </h4>
              {availableTypes.length > 1 && (
                <RadioGroup 
                  value={currentType} 
                  onValueChange={(value) => onCategoryFulfillmentTypeChange(category.id, value)}
                  className="mt-2 flex flex-col space-y-2"
                >
                  {availableTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={`${type}-${category.id}`} />
                      <Label htmlFor={`${type}-${category.id}`}>
                        {t(`checkout.fulfillment.${type.toLowerCase()}`)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
            
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={currentType === FULFILLMENT_TYPE_PICKUP ? pickupDetail : null}
              onPickupDetailChange={onPickupDetailChange}
              fulfillmentType={currentType}
              allPickupCategories={[]}
            />
            
            {currentType === FULFILLMENT_TYPE_DELIVERY && 
             deliveryDates[category.id] && 
             onDeliveryTimeSlotSelectionChange && 
             deliverySettings?.time_slots && (
              <CategoryDeliverySettings 
                categoryId={category.id}
                categoryName={language === 'en' ? category.name : category.name_ko || category.name}
                selectedDate={deliveryDates[category.id]}
                onTimeSlotSelectionChange={(selection) => 
                  onDeliveryTimeSlotSelectionChange(category.id, selection)
                }
              />
            )}
          </div>
        );
      })}

      {needsDeliveryAddress && (
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
