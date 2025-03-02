
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
import { getCommonPickupDays, getCommonPickupLocations, getNextValidPickupDate } from '@/utils/pickupUnification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [commonPickupDays, setCommonPickupDays] = useState<number[]>([]);
  const [commonPickupLocations, setCommonPickupLocations] = useState<PickupDetail[]>([]);
  const [unifiedPickupDate, setUnifiedPickupDate] = useState<Date | undefined>(undefined);

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

  // Calculate common pickup days and locations across all categories with items
  useEffect(() => {
    if (!categories.length || !items.length) return;
    
    const itemCategoryIds = items.map(item => item.category_id).filter(Boolean);
    const categoriesWithItems = categories.filter(cat => 
      itemCategoryIds.includes(cat.id)
    );
    
    // Get common pickup days across all categories with items
    const commonDays = getCommonPickupDays(categoriesWithItems);
    setCommonPickupDays(commonDays);
    
    // Get common pickup locations across all categories with items
    const commonLocations = getCommonPickupLocations(categoriesWithItems);
    setCommonPickupLocations(commonLocations);
    
    // If we have common pickup days, set a default pickup date
    if (commonDays.length > 0) {
      const today = new Date();
      const nextValidDate = getNextValidPickupDate(today, commonDays);
      setUnifiedPickupDate(nextValidDate);
      
      // Update all category delivery dates to this unified date
      if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
        const categoryIds = Object.keys(itemsByCategory);
        categoryIds.forEach(categoryId => {
          onDateChange(categoryId, nextValidDate);
        });
      }
    }
  }, [categories, items, fulfillmentType]);

  // When unified pickup date changes, update all category dates
  useEffect(() => {
    if (fulfillmentType !== FULFILLMENT_TYPE_PICKUP || !unifiedPickupDate) return;
    
    const categoryIds = Object.keys(itemsByCategory);
    categoryIds.forEach(categoryId => {
      onDateChange(categoryId, unifiedPickupDate);
    });
  }, [unifiedPickupDate, fulfillmentType]);

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
    
    // Check if we should allow mixed delivery types
    const hasMultipleTypes = Array.from(fulfillmentTypes).length > 1;
    setHasMixedDelivery(hasMultipleTypes);
    
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

  // Handle unified pickup date selection
  const handleUnifiedPickupDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    setUnifiedPickupDate(date);
    
    // Update all category delivery dates
    const categoryIds = Object.keys(itemsByCategory);
    categoryIds.forEach(categoryId => {
      onDateChange(categoryId, date);
    });
  };

  // Handle unified pickup detail selection
  const handleUnifiedPickupDetailChange = (value: string) => {
    if (!value) return;
    
    const [location, time] = value.split('|');
    
    if (!location || !time) return;
    
    const detail: PickupDetail = { location, time };
    onPickupDetailChange(detail);
  };

  useEffect(() => {
    // Display warnings if mixing fulfillment types
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      if (commonPickupDays.length === 0) {
        setWarning("No common pickup days found across all items. Please consider choosing delivery or removing some items.");
      } else if (hasCustomPickupItems && (!pickupDetail || !unifiedPickupDate)) {
        setWarning("Please select a pickup date and location that will apply to all items in your order.");
      } else {
        setWarning(null);
      }
    } else if (hasMixedDelivery) {
      setWarning("Your order contains items with different fulfillment requirements. You'll need to select appropriate dates for each category.");
    } else {
      setWarning(null);
    }
  }, [fulfillmentType, hasCustomPickupItems, hasMixedDelivery, commonPickupDays, pickupDetail, unifiedPickupDate]);

  // Show mixed category fulfillment options if we have multiple categories
  const showMixedCategoryOptions = hasMixedDelivery && Object.keys(itemsByCategory).length > 1;

  // Get all pickup category names
  const pickupCategoryNames = getPickupCategories();

  // Filter calendar days to only allow pickup on valid days
  const isDateDisabled = (date: Date) => {
    if (fulfillmentType !== FULFILLMENT_TYPE_PICKUP) return false;
    
    const dayOfWeek = date.getDay();
    return !commonPickupDays.includes(dayOfWeek);
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
            
            // Skip if category doesn't support multiple fulfillment types
            if (category.fulfillment_types.length <= 1) return null;
            
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

      {/* Unified Pickup Selection for Pickup Orders */}
      {fulfillmentType === FULFILLMENT_TYPE_PICKUP && (
        <div className="space-y-4">
          <h3 className="font-medium">Pickup Details</h3>
          
          {/* Pickup Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="pickup-date">Pickup Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !unifiedPickupDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {unifiedPickupDate ? (
                    format(unifiedPickupDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={unifiedPickupDate}
                  onSelect={handleUnifiedPickupDateChange}
                  disabled={isDateDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {commonPickupDays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Available pickup days: {commonPickupDays.map(day => {
                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return dayNames[day];
                }).join(', ')}
              </p>
            )}
          </div>

          {/* Pickup Location and Time Selection */}
          {commonPickupLocations.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="pickup-detail">Pickup Location & Time</Label>
              <Select 
                onValueChange={handleUnifiedPickupDetailChange}
                value={pickupDetail ? `${pickupDetail.location}|${pickupDetail.time}` : undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select pickup location and time" />
                </SelectTrigger>
                <SelectContent>
                  {commonPickupLocations.map((detail, index) => (
                    <SelectItem 
                      key={`pickup-${index}`} 
                      value={`${detail.location}|${detail.time}`}
                    >
                      {detail.location} - {detail.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Separator />
        </div>
      )}

      {/* Only show individual category selections for delivery orders */}
      {fulfillmentType === FULFILLMENT_TYPE_DELIVERY && categories.map((category) => {
        // Skip categories with no items
        if (!itemsByCategory[category.id]) return null;
        
        // For mixed delivery, use the category-specific fulfillment type
        const effectiveFulfillmentType = showMixedCategoryOptions 
          ? categoryFulfillmentTypes[category.id] || fulfillmentType
          : fulfillmentType;
        
        // Skip categories that don't match the selected fulfillment type
        if (!category.fulfillment_types?.includes(effectiveFulfillmentType)) return null;
        
        // Skip individual category displays for pickup items - we handle those in the unified section above
        if (effectiveFulfillmentType === FULFILLMENT_TYPE_PICKUP) return null;
        
        return (
          <div key={category.id} className="space-y-4">
            <CategoryDeliveryDate
              category={category}
              selectedDate={deliveryDates[category.id]}
              onDateChange={(date) => onDateChange(category.id, date)}
              selectedPickupDetail={null} // No pickup details for delivery items
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
