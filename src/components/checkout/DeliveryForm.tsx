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
import { Switch } from '@/components/ui/switch';

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
  onCategoryFulfillmentTypeChange
}: DeliveryFormProps) {
  const { items } = useCart();
  const [availableFulfillmentTypes, setAvailableFulfillmentTypes] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasMixedDelivery, setHasMixedDelivery] = useState(false);
  const [hasPickupOnlyCategories, setHasPickupOnlyCategories] = useState(false);
  
  const [useJointPickup, setUseJointPickup] = useState(true);
  const [sharedPickupDate, setSharedPickupDate] = useState<Date | undefined>(undefined);
  const [sharedPickupDetail, setSharedPickupDetail] = useState<PickupDetail | null>(null);
  const [pickupCategoryNames, setPickupCategoryNames] = useState<string[]>([]);
  const [hasJointPickupCategories, setHasJointPickupCategories] = useState(false);

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

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
        has_custom_pickup: category.has_custom_pickup,
        pickup_details: (category.pickup_details || []).map((detail: any) => ({
          time: detail.time,
          location: detail.location
        })),
        fulfillment_types: category.fulfillment_types || [],
        pickup_days: category.pickup_days || [],
        allow_joint_pickup: category.allow_joint_pickup ?? false
      }));
    },
  });

  const getPickupCategories = () => {
    const pickupCategoryIds = showMixedCategoryOptions
      ? Object.keys(categoryFulfillmentTypes).filter(id => categoryFulfillmentTypes[id] === FULFILLMENT_TYPE_PICKUP)
      : fulfillmentType === FULFILLMENT_TYPE_PICKUP ? Object.keys(itemsByCategory) : [];
      
    return pickupCategoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category ? category.name : '';
    }).filter(Boolean);
  };

  useEffect(() => {
    if (!categories.length) return;
    
    const fulfillmentTypes = new Set<string>();
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    let hasPickupOnly = false;
    let allCategoriesPickupOnly = true;
    
    const jointPickupCategories = categories.filter(category => 
      category.allow_joint_pickup === true && 
      itemCategoryIds.includes(category.id) &&
      (category.fulfillment_types?.includes(FULFILLMENT_TYPE_PICKUP) || []).length > 0
    );

    setHasJointPickupCategories(jointPickupCategories.length > 1);
    
    console.log('Joint pickup categories:', jointPickupCategories);
    
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
    
    setPickupCategoryNames(getPickupCategories());
  }, [categories, items, fulfillmentType, onFulfillmentTypeChange, categoryFulfillmentTypes]);

  const hasCustomPickupItems = categories.some(category => 
    category.has_custom_pickup && 
    itemsByCategory[category.id]?.length > 0
  );

  useEffect(() => {
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && hasCustomPickupItems) {
      setWarning("Your order contains items with specific pickup requirements. Please select valid pickup times and locations where requested.");
    } else if (hasMixedDelivery) {
      setWarning("Your order contains items with different fulfillment requirements. You'll need to select appropriate dates for each category.");
    } else {
      setWarning(null);
    }
    
    setPickupCategoryNames(getPickupCategories());
  }, [fulfillmentType, hasCustomPickupItems, hasMixedDelivery, categoryFulfillmentTypes]);

  const showMixedCategoryOptions = hasMixedDelivery && Object.keys(itemsByCategory).length > 1;

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

  const handleDeliveryDateChange = (categoryId: string, date: Date) => {
    console.log(`DeliveryForm handling date change for ${categoryId}:`, date);
    
    if (!(date instanceof Date)) {
      console.error("Invalid date object in handleDeliveryDateChange", date);
      return;
    }
    
    if (useJointPickup && fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      const category = categories.find(c => c.id === categoryId);
      if (category?.allow_joint_pickup) {
        setSharedPickupDate(date);
        
        categories.forEach(c => {
          if (c.allow_joint_pickup && itemsByCategory[c.id]?.length > 0) {
            onDateChange(c.id, date);
          }
        });
        return;
      }
    }
    
    onDateChange(categoryId, date);
  };

  const handlePickupDetailChange = (detail: PickupDetail) => {
    if (useJointPickup && fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      setSharedPickupDetail(detail);
    }
    
    onPickupDetailChange(detail);
  };

  return (
    <div className="space-y-6">
      {!showMixedCategoryOptions && availableFulfillmentTypes.length > 1 && (
        <div className="space-y-4">
          <h3 className="font-medium">Fulfillment Method</h3>
          <RadioGroup 
            value={fulfillmentType} 
            onValueChange={onFulfillmentTypeChange}
            className="flex flex-col space-y-2"
          >
            {availableFulfillmentTypes.includes(FULFILLMENT_TYPE_DELIVERY) && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={FULFILLMENT_TYPE_DELIVERY} id={FULFILLMENT_TYPE_DELIVERY} />
                <Label htmlFor={FULFILLMENT_TYPE_DELIVERY}>Delivery</Label>
              </div>
            )}
            {availableFulfillmentTypes.includes(FULFILLMENT_TYPE_PICKUP) && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={FULFILLMENT_TYPE_PICKUP} id={FULFILLMENT_TYPE_PICKUP} />
                <Label htmlFor={FULFILLMENT_TYPE_PICKUP}>Pickup</Label>
              </div>
            )}
          </RadioGroup>
          
          {warning && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          {fulfillmentType === FULFILLMENT_TYPE_PICKUP && hasJointPickupCategories && (
            <div className="border p-3 rounded bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Synchronized Pickup</h4>
                  <p className="text-sm text-muted-foreground">Use the same pickup date and location for all eligible items</p>
                </div>
                <Switch
                  checked={useJointPickup}
                  onCheckedChange={setUseJointPickup}
                  id="joint-pickup-toggle"
                />
              </div>
            </div>
          )}
          
          <Separator />
        </div>
      )}

      {showMixedCategoryOptions && (
        <div className="space-y-4">
          <h3 className="font-medium">Delivery Methods by Category</h3>
          
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
                <h4 className="font-medium">{category.name}</h4>
                <RadioGroup 
                  value={categoryFulfillmentTypes[categoryId] || fulfillmentType} 
                  onValueChange={(value) => onCategoryFulfillmentTypeChange(categoryId, value)}
                  className="flex flex-col space-y-2"
                >
                  {category.fulfillment_types.includes(FULFILLMENT_TYPE_DELIVERY) && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={FULFILLMENT_TYPE_DELIVERY} id={`${FULFILLMENT_TYPE_DELIVERY}-${categoryId}`} />
                      <Label htmlFor={`${FULFILLMENT_TYPE_DELIVERY}-${categoryId}`}>Delivery</Label>
                    </div>
                  )}
                  {category.fulfillment_types.includes(FULFILLMENT_TYPE_PICKUP) && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={FULFILLMENT_TYPE_PICKUP} id={`${FULFILLMENT_TYPE_PICKUP}-${categoryId}`} />
                      <Label htmlFor={`${FULFILLMENT_TYPE_PICKUP}-${categoryId}`}>Pickup</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            );
          })}
          
          {hasJointPickupCategories && (
            <div className="border p-3 rounded bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Synchronized Pickup</h4>
                  <p className="text-sm text-muted-foreground">Use the same pickup date and location for all eligible pickup items</p>
                </div>
                <Switch
                  checked={useJointPickup}
                  onCheckedChange={setUseJointPickup}
                  id="joint-pickup-toggle-mixed"
                />
              </div>
            </div>
          )}
          
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
        
        if (!category.fulfillment_types?.includes(effectiveFulfillmentType)) return null;
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => handleDeliveryDateChange(category.id, date)}
              selectedPickupDetail={effectiveFulfillmentType === FULFILLMENT_TYPE_PICKUP ? pickupDetail : null}
              onPickupDetailChange={handlePickupDetailChange}
              fulfillmentType={effectiveFulfillmentType}
              allPickupCategories={pickupCategoryNames}
              sharedSelectedDate={useJointPickup ? sharedPickupDate : undefined}
              sharedPickupDetail={useJointPickup ? sharedPickupDetail : null}
              isJointPickupActive={useJointPickup}
            />
            <Separator />
          </div>
        );
      })}

      {needsDeliveryAddress() && (
        <div className="space-y-2">
          <Label htmlFor="delivery-address">Delivery Address (Required)</Label>
          <Input 
            id="delivery-address"
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            placeholder="Enter your complete delivery address"
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
