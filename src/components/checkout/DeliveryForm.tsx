
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CategoryDeliveryDate } from './delivery/CategoryDeliveryDate';
import { DeliveryNotes } from './delivery/DeliveryNotes';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PickupDetail } from '@/types/pickup';

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
  const [warning, setWarning] = useState<string | null>(null);

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

  const needsDeliveryAddress = Object.values(categoryFulfillmentTypes).some(
    type => type === FULFILLMENT_TYPE_DELIVERY
  );

  // Process categories to add required properties
  const processedCategories = categories.map(category => ({
    ...category,
    pickup_details: [],
    pickup_days: category.has_custom_pickup ? [0, 1, 2, 3, 4, 5, 6] : [] // Default to all days if has_custom_pickup is true
  }));

  return (
    <div className="space-y-6">
      {processedCategories.map((category) => {
        if (!itemsByCategory[category.id]) return null;
        const availableTypes = category.fulfillment_types || [];
        const currentType = categoryFulfillmentTypes[category.id] || fulfillmentType;
        const isMultipleOptions = availableTypes.length > 1;
        
        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>
                {language === 'en' ? category.name : category.name_ko || category.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {isMultipleOptions ? t('checkout.fulfillment.select') : t('checkout.fulfillment.type')}
                </Label>
                <RadioGroup 
                  value={currentType} 
                  onValueChange={(value) => onCategoryFulfillmentTypeChange(category.id, value)}
                  className="flex flex-col space-y-2"
                  disabled={!isMultipleOptions}
                >
                  {availableTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={type} 
                        id={`${type}-${category.id}`}
                        disabled={!isMultipleOptions}
                      />
                      <Label 
                        htmlFor={`${type}-${category.id}`}
                        className={!isMultipleOptions ? "text-gray-500" : ""}
                      >
                        {t(`checkout.fulfillment.${type.toLowerCase()}`)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
               onDeliveryTimeSlotSelectionChange && (
                <CategoryDeliverySettings 
                  categoryId={category.id}
                  categoryName={language === 'en' ? category.name : category.name_ko || category.name}
                  selectedDate={deliveryDates[category.id]}
                  onTimeSlotSelectionChange={(selection) => 
                    onDeliveryTimeSlotSelectionChange(category.id, selection)
                  }
                />
              )}
            </CardContent>
          </Card>
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
