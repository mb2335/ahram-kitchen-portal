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
  const [hasMixedDelivery, setHasMixedDelivery] = useState(false);
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

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const hasCustomPickupItems = categories.some(category => 
    category.has_custom_pickup && 
    itemsByCategory[category.id]?.length > 0
  );

  const getPickupCategories = () => {
    const pickupCategoryIds = showMixedCategoryOptions
      ? Object.keys(categoryFulfillmentTypes).filter(id => categoryFulfillmentTypes[id] === FULFILLMENT_TYPE_PICKUP)
      : fulfillmentType === FULFILLMENT_TYPE_PICKUP ? Object.keys(itemsByCategory) : [];
      
    return pickupCategoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category ? { name: category.name, name_ko: category.name_ko } : null;
    }).filter(Boolean);
  };

  useEffect(() => {
    if (!categories.length) return;
    
    const fulfillmentTypes = new Set<string>();
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    let hasPickupOnly = false;
    let allCategoriesPickupOnly = true;
    
    categories.forEach(category => {
      if (itemCategoryIds.includes(category.id)) {
        category.fulfillment_types?.forEach(type => fulfillmentTypes.add(type));
        
        const isPickupOnly = category.fulfillment_types?.length === 1 && 
                             category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP;
        
        if (isPickupOnly) {
          hasPickupOnly = true;
        } else {
          allCategoriesPickupOnly = false;
        }
      }
    });
    
    setHasPickupOnlyCategories(hasPickupOnly);
    
    const availableTypes = Array.from(fulfillmentTypes);
    setAvailableFulfillmentTypes(availableTypes);
    
    const hasMultipleTypes = Array.from(fulfillmentTypes).length > 1;
    setHasMixedDelivery(hasMultipleTypes && !allCategoriesPickupOnly);
    
    if (!fulfillmentType && availableTypes.length > 0) {
      if (hasPickupOnly && availableTypes.includes(FULFILLMENT_TYPE_PICKUP)) {
        onFulfillmentTypeChange(FULFILLMENT_TYPE_PICKUP);
      } else if (availableTypes.includes(FULFILLMENT_TYPE_DELIVERY)) {
        onFulfillmentTypeChange(FULFILLMENT_TYPE_DELIVERY);
      } else {
        onFulfillmentTypeChange(availableTypes[0]);
      }
    }
  }, [categories, items, fulfillmentType, onFulfillmentTypeChange]);

  useEffect(() => {
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && hasCustomPickupItems) {
      setWarning(t('checkout.error.pickup'));
    } else if (hasMixedDelivery) {
      setWarning(t('checkout.categories.methods'));
    } else {
      setWarning(null);
    }
  }, [fulfillmentType, hasCustomPickupItems, hasMixedDelivery, t]);

  const showMixedCategoryOptions = hasMixedDelivery && Object.keys(itemsByCategory).length > 1;

  const pickupCategoryNames = getPickupCategories();

  const needsDeliveryAddress = () => {
    if (!showMixedCategoryOptions) {
      return fulfillmentType === FULFILLMENT_TYPE_DELIVERY;
    }

    return Object.entries(categoryFulfillmentTypes).some(([categoryId, type]) => {
      const category = categories.find(c => c.id === categoryId);
      if (category?.fulfillment_types.length === 1 && 
          category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
        return false;
      }
      
      return type === FULFILLMENT_TYPE_DELIVERY;
    });
  };

  const handleTimeSlotSelectionChange = (categoryId: string) => (selection: DeliveryTimeSlotSelection) => {
    if (onDeliveryTimeSlotSelectionChange) {
      onDeliveryTimeSlotSelectionChange(categoryId, selection);
    }
  };

  return (
    <div className="space-y-6">
      {!showMixedCategoryOptions && availableFulfillmentTypes.length > 1 && (
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
          
          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          <Separator />
        </div>
      )}

      {showMixedCategoryOptions && (
        <div className="space-y-4">
          <h3 className="font-medium">{t('checkout.categories.methods')}</h3>
          
          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          {Object.entries(itemsByCategory).map(([categoryId, categoryItems]) => {
            const category = categories.find(c => c.id === categoryId);
            if (!category) return null;
            
            if (category.fulfillment_types.length <= 1) {
              if (category.fulfillment_types.length === 1 && 
                  category.fulfillment_types[0] !== categoryFulfillmentTypes[categoryId]) {
                onCategoryFulfillmentTypeChange(categoryId, category.fulfillment_types[0]);
              }
              return null;
            }
            
            return (
              <div key={`fulfillment-${categoryId}`} className="border p-3 rounded space-y-3">
                <h4 className="font-medium">
                  {language === 'en' ? category.name : category.name_ko || category.name}
                </h4>
                <RadioGroup 
                  value={categoryFulfillmentTypes[categoryId] || fulfillmentType} 
                  onValueChange={(value) => onCategoryFulfillmentTypeChange(categoryId, value)}
                  className="flex flex-col space-y-2"
                >
                  {category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={FULFILLMENT_TYPE_DELIVERY} id={`${FULFILLMENT_TYPE_DELIVERY}-${categoryId}`} />
                      <Label htmlFor={`${FULFILLMENT_TYPE_DELIVERY}-${categoryId}`}>{t('checkout.fulfillment.delivery')}</Label>
                    </div>
                  )}
                  {category.fulfillment_types.includes(FULFILLMENT_TYPE_PICKUP) && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={FULFILLMENT_TYPE_PICKUP} id={`${FULFILLMENT_TYPE_PICKUP}-${categoryId}`} />
                      <Label htmlFor={`${FULFILLMENT_TYPE_PICKUP}-${categoryId}`}>{t('checkout.fulfillment.pickup')}</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            );
          })}
          
          <Separator />
        </div>
      )}

      {categories.map((category) => {
        if (!itemsByCategory[category.id]) return null;
        
        const effectiveFulfillmentType = showMixedCategoryOptions 
          ? categoryFulfillmentTypes[category.id] || fulfillmentType
          : (
            category.fulfillment_types.length === 1 && 
            category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP
          ) ? FULFILLMENT_TYPE_PICKUP : fulfillmentType;
        
        if (!Array.isArray(category.fulfillment_types) || !category.fulfillment_types.includes(effectiveFulfillmentType)) {
          return null;
        }
        
        const pickupDetailsForCategory = Object.values(pickupDetailsByDay).flat();
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={{
                ...category,
                pickup_details: pickupDetailsForCategory,
                pickup_days: Object.keys(pickupDetailsByDay).map(Number)
              }}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={effectiveFulfillmentType === FULFILLMENT_TYPE_PICKUP ? pickupDetail : null}
              onPickupDetailChange={onPickupDetailChange}
              fulfillmentType={effectiveFulfillmentType}
              allPickupCategories={pickupCategoryNames}
            />
            
            {effectiveFulfillmentType === FULFILLMENT_TYPE_DELIVERY && 
             deliveryDates[category.id] && 
             onDeliveryTimeSlotSelectionChange && (
              <CategoryDeliverySettings 
                categoryId={category.id}
                categoryName={language === 'en' ? category.name : category.name_ko || category.name}
                selectedDate={deliveryDates[category.id]}
                onTimeSlotSelectionChange={handleTimeSlotSelectionChange(category.id)}
              />
            )}
            <Separator />
          </div>
        );
      })}

      {needsDeliveryAddress() && (
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
          <Separator className="mt-4" />
        </div>
      )}

      <DeliveryNotes
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
}
