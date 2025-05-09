
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';

interface OrderFiltersProps {
  onFilterChange: (filters: OrderFilters) => void;
  categories: { id: string; name: string }[];
  pickupLocations: string[];
}

export interface OrderFilters {
  date?: Date;
  categoryId?: string;
  pickupLocation?: string;
  fulfillmentType?: string;
}

export function OrderFilters({ onFilterChange, categories, pickupLocations }: OrderFiltersProps) {
  const [filters, setFilters] = useState<OrderFilters>({
    categoryId: 'all',
    pickupLocation: 'all',
    fulfillmentType: 'all'
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // When a filter value changes, update both local state and propagate to parent
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    console.log(`Filter changed: ${key} = ${value}`);
    
    // Create new filters object with the updated value
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // For date changes, also update the selectedDate state
    if (key === 'date') {
      setSelectedDate(value);
    }
    
    // Create and apply external filters (non-"all" values)
    applyFilters(newFilters, key === 'date' ? value : selectedDate);
  };

  // Extract the filter application logic to a separate function
  const applyFilters = (filterState: OrderFilters, dateValue?: Date) => {
    const externalFilters: OrderFilters = {};
    
    // Only add properties to externalFilters if they aren't "all"
    if (filterState.categoryId && filterState.categoryId !== 'all') {
      externalFilters.categoryId = filterState.categoryId;
    }
    
    if (filterState.pickupLocation && filterState.pickupLocation !== 'all') {
      externalFilters.pickupLocation = filterState.pickupLocation;
    }
    
    if (filterState.fulfillmentType && filterState.fulfillmentType !== 'all') {
      externalFilters.fulfillmentType = filterState.fulfillmentType;
    }
    
    // Add date using the provided dateValue (which could be from a direct date change)
    if (dateValue) {
      externalFilters.date = dateValue;
    }
    
    console.log('Applied filters:', externalFilters);
    onFilterChange(externalFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      categoryId: 'all',
      pickupLocation: 'all',
      fulfillmentType: 'all'
    };
    setFilters(clearedFilters);
    setSelectedDate(undefined);
    onFilterChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Filter Orders</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Fulfillment Date</Label>
          <DatePicker
            date={selectedDate}
            onSelect={(date) => {
              // Directly handle date selection with immediate filter application
              handleFilterChange('date', date);
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.categoryId}
            onValueChange={(value) => handleFilterChange('categoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id || "unknown-category"} value={category.id || "unknown-category"}>
                  {category.name || "Unnamed category"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fulfillment Type</Label>
          <Select
            value={filters.fulfillmentType}
            onValueChange={(value) => handleFilterChange('fulfillmentType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value={FULFILLMENT_TYPE_PICKUP}>Pickup</SelectItem>
              <SelectItem value={FULFILLMENT_TYPE_DELIVERY}>Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pickup Location</Label>
          <Select
            value={filters.pickupLocation}
            onValueChange={(value) => handleFilterChange('pickupLocation', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {pickupLocations.map((location) => (
                <SelectItem key={location || "unknown-location"} value={location || "unknown-location"}>
                  {location || "Unspecified location"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
