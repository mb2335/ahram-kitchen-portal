
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
  setCategoryFulfillmentTypes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
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
  setCategoryFulfillmentTypes
}: DeliveryFormProps) {
  const { items } = useCart();
  const [availableFulfillmentTypes, setAvailableFulfillmentTypes] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasMixedDelivery, setHasMixedDelivery] = useState(false);

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
        pickup_days: category.pickup_days || []
      }));
    },
  });

  // Calculate available fulfillment types across all categories
  useEffect(() => {
    if (!categories.length) return;
    
    const fulfillmentTypes = new Set<string>();
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    
    // Initialize defaults for category fulfillment types
    const defaultCategoryFulfillmentTypes: Record<string, string> = {};
    
    categories.forEach(category => {
      if (itemCategoryIds.includes(category.id)) {
        category.fulfillment_types?.forEach(type => fulfillmentTypes.add(type));
        
        // Set default fulfillment type for this category
        if (!categoryFulfillmentTypes[category.id]) {
          defaultCategoryFulfillmentTypes[category.id] = 
            category.fulfillment_types?.includes(FULFILLMENT_TYPE_DELIVERY) 
              ? FULFILLMENT_TYPE_DELIVERY 
              : FULFILLMENT_TYPE_PICKUP;
        }
      }
    });
    
    // Check if we should allow mixed delivery types
    const hasMultipleTypes = Array.from(fulfillmentTypes).length > 1;
    setHasMixedDelivery(hasMultipleTypes);
    
    // Update category fulfillment types with defaults if not set
    if (Object.keys(categoryFulfillmentTypes).length === 0) {
      setCategoryFulfillmentTypes(defaultCategoryFulfillmentTypes);
    }
    
    const availableTypes = Array.from(fulfillmentTypes);
    setAvailableFulfillmentTypes(availableTypes);
    
    // Set default fulfillment type if none selected and options available
    if ((!fulfillmentType || !availableTypes.includes(fulfillmentType)) && availableTypes.length > 0) {
      onFulfillmentTypeChange(availableTypes[0]);
    }
  }, [categories, items, fulfillmentType, onFulfillmentTypeChange, categoryFulfillmentTypes, setCategoryFulfillmentTypes]);

  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Check if there are items that need custom fulfillment
  const hasCustomPickupItems = categories.some(category => 
    category.has_custom_pickup && 
    itemsByCategory[category.id]?.length > 0
  );

  // Get all categories that are currently set for pickup
  const getPickupCategories = () => {
    const pickupCategoryIds = showMixedCategoryOptions
      ? Object.keys(categoryFulfillmentTypes).filter(id => categoryFulfillmentTypes[id] === FULFILLMENT_TYPE_PICKUP)
      : fulfillmentType === FULFILLMENT_TYPE_PICKUP ? Object.keys(itemsByCategory) : [];
      
    return pickupCategoryIds.map(id => {
      const category = categories.find(c => c.id === id);
      return category ? category.name : '';
    }).filter(Boolean);
  };

  const handleCategoryFulfillmentChange = (categoryId: string, type: string) => {
    setCategoryFulfillmentTypes(prev => ({
      ...prev,
      [categoryId]: type
    }));
    
    // Check if we need to update the global fulfillment type
    const allTypes = Object.values({ ...categoryFulfillmentTypes, [categoryId]: type });
    const hasPickup = allTypes.includes(FULFILLMENT_TYPE_PICKUP);
    const hasDelivery = allTypes.includes(FULFILLMENT_TYPE_DELIVERY);
    
    // If we have both pickup and delivery, set the global type based on what we have more of
    if (hasPickup && hasDelivery) {
      const pickupCount = allTypes.filter(t => t === FULFILLMENT_TYPE_PICKUP).length;
      const deliveryCount = allTypes.filter(t => t === FULFILLMENT_TYPE_DELIVERY).length;
      onFulfillmentTypeChange(pickupCount > deliveryCount ? FULFILLMENT_TYPE_PICKUP : FULFILLMENT_TYPE_DELIVERY);
    } else {
      // Otherwise, set to whatever type we have
      onFulfillmentTypeChange(hasPickup ? FULFILLMENT_TYPE_PICKUP : FULFILLMENT_TYPE_DELIVERY);
    }
  };

  useEffect(() => {
    // Display warnings if mixing fulfillment types
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP && hasCustomPickupItems) {
      setWarning("Your order contains items with specific pickup requirements. Please select valid pickup times and locations where requested.");
    } else if (hasMixedDelivery) {
      setWarning("Your order contains items with different fulfillment requirements. You'll need to select appropriate dates for each category.");
    } else {
      setWarning(null);
    }
  }, [fulfillmentType, hasCustomPickupItems, hasMixedDelivery]);

  // Show mixed category fulfillment options if we have multiple categories
  const showMixedCategoryOptions = hasMixedDelivery && Object.keys(itemsByCategory).length > 1;

  // Get all pickup category names
  const pickupCategoryNames = getPickupCategories();

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
          
          <Separator />
        </div>
      )}

      {/* Display per-category fulfillment options if we have mixed delivery */}
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
            
            // Skip if category doesn't support multiple fulfillment types
            if (category.fulfillment_types.length <= 1) return null;
            
            return (
              <div key={`fulfillment-${categoryId}`} className="border p-3 rounded space-y-3">
                <h4 className="font-medium">{category.name}</h4>
                <RadioGroup 
                  value={categoryFulfillmentTypes[categoryId] || fulfillmentType} 
                  onValueChange={(value) => handleCategoryFulfillmentChange(categoryId, value)}
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
          
          <Separator />
        </div>
      )}

      {/* Only show relevant categories based on selected fulfillment type */}
      {categories.map((category) => {
        // Skip categories with no items
        if (!itemsByCategory[category.id]) return null;
        
        // For mixed delivery, use the category-specific fulfillment type
        const effectiveFulfillmentType = showMixedCategoryOptions 
          ? categoryFulfillmentTypes[category.id] || fulfillmentType
          : fulfillmentType;
        
        // Skip categories that don't match the selected fulfillment type
        if (!category.fulfillment_types?.includes(effectiveFulfillmentType)) return null;
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={effectiveFulfillmentType === FULFILLMENT_TYPE_PICKUP ? pickupDetail : null}
              onPickupDetailChange={onPickupDetailChange}
              fulfillmentType={effectiveFulfillmentType}
              allPickupCategories={pickupCategoryNames}
            />
            <Separator />
          </div>
        );
      })}

      {/* Delivery address is required for delivery orders */}
      {(fulfillmentType === FULFILLMENT_TYPE_DELIVERY || Object.values(categoryFulfillmentTypes).includes(FULFILLMENT_TYPE_DELIVERY)) && (
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
