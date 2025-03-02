
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
    let hasPickupOnly = false;
    let allCategoriesPickupOnly = true;
    
    // Check each category with items in the cart
    categories.forEach(category => {
      if (itemCategoryIds.includes(category.id)) {
        // Add all available fulfillment types
        category.fulfillment_types?.forEach(type => fulfillmentTypes.add(type));
        
        // Check if this is a pickup-only category
        const isPickupOnly = category.fulfillment_types?.length === 1 && 
                             category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP;
        
        if (isPickupOnly) {
          hasPickupOnly = true;
        } else {
          allCategoriesPickupOnly = false;
        }
      }
    });
    
    // Set pickup-only state
    setHasPickupOnlyCategories(hasPickupOnly);
    
    // If all categories are pickup-only, only show pickup option
    const availableTypes = Array.from(fulfillmentTypes);
    setAvailableFulfillmentTypes(availableTypes);
    
    // Check if we should allow mixed delivery types
    const hasMultipleTypes = Array.from(fulfillmentTypes).length > 1;
    setHasMixedDelivery(hasMultipleTypes && !allCategoriesPickupOnly);
    
    // Set default fulfillment type if none selected and options available
    if (!fulfillmentType && availableTypes.length > 0) {
      // If we have pickup-only categories, default to pickup
      if (hasPickupOnly && availableTypes.includes(FULFILLMENT_TYPE_PICKUP)) {
        onFulfillmentTypeChange(FULFILLMENT_TYPE_PICKUP);
      } else if (availableTypes.includes(FULFILLMENT_TYPE_DELIVERY)) {
        onFulfillmentTypeChange(FULFILLMENT_TYPE_DELIVERY);
      } else {
        onFulfillmentTypeChange(availableTypes[0]);
      }
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

  // Show mixed category fulfillment options if we have multiple categories with different options
  const showMixedCategoryOptions = hasMixedDelivery && Object.keys(itemsByCategory).length > 1;

  // Get all pickup category names
  const pickupCategoryNames = getPickupCategories();

  // Check if any categories require delivery address
  const needsDeliveryAddress = () => {
    // If there's no mixed delivery, use the global fulfillment type
    if (!showMixedCategoryOptions) {
      return fulfillmentType === FULFILLMENT_TYPE_DELIVERY;
    }

    // For mixed delivery, check if any category has delivery selected
    return Object.entries(categoryFulfillmentTypes).some(([categoryId, type]) => {
      // If this category only supports pickup, never need delivery address
      const category = categories.find(c => c.id === categoryId);
      if (category?.fulfillment_types.length === 1 && 
          category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP) {
        return false;
      }
      
      return type === FULFILLMENT_TYPE_DELIVERY;
    });
  };

  // Function to handle delivery date changes and ensure we log them
  const handleDeliveryDateChange = (categoryId: string, date: Date) => {
    console.log(`DeliveryForm received date change for ${categoryId}:`, date);
    
    // Ensure that we are passing a valid Date object
    if (!(date instanceof Date)) {
      console.error("Invalid date object passed to handleDeliveryDateChange");
      return;
    }
    
    // Pass the date to the parent component
    onDateChange(categoryId, date);
    
    // Log the date in deliveryDates to confirm it was updated
    setTimeout(() => {
      console.log(`DeliveryDates after update for ${categoryId}:`, deliveryDates[categoryId]);
    }, 0);
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
            
            // Skip if category only supports one fulfillment type
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
          : (
            // Handle pickup-only categories
            category.fulfillment_types.length === 1 && 
            category.fulfillment_types[0] === FULFILLMENT_TYPE_PICKUP
          ) ? FULFILLMENT_TYPE_PICKUP : fulfillmentType;
        
        // Skip categories that don't match the selected fulfillment type
        if (!category.fulfillment_types?.includes(effectiveFulfillmentType)) return null;
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => handleDeliveryDateChange(category.id, date)}
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
