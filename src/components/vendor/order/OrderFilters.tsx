
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    // If value is "all", set it to undefined in the external filter state
    const newValue = value === "all" ? undefined : value;
    const newFilters = { ...filters, [key]: value }; // Keep "all" value in internal state
    setFilters(newFilters);
    
    // Create external filters object with correct values
    const externalFilters: OrderFilters = {};
    
    // Only add properties to externalFilters if they aren't "all"
    if (newFilters.categoryId && newFilters.categoryId !== 'all') {
      externalFilters.categoryId = newFilters.categoryId;
    }
    
    if (newFilters.pickupLocation && newFilters.pickupLocation !== 'all') {
      externalFilters.pickupLocation = newFilters.pickupLocation;
    }
    
    if (newFilters.fulfillmentType && newFilters.fulfillmentType !== 'all') {
      externalFilters.fulfillmentType = newFilters.fulfillmentType;
    }
    
    // Add date separately as it's handled differently
    if (dateRange?.from) {
      externalFilters.date = dateRange.from;
    }
    
    onFilterChange(externalFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      categoryId: 'all',
      pickupLocation: 'all',
      fulfillmentType: 'all'
    };
    setFilters(clearedFilters);
    setDateRange(undefined);
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
          <Label>Date</Label>
          <DatePickerWithRange
            date={dateRange}
            onSelect={(newDateRange: DateRange | undefined) => {
              setDateRange(newDateRange);
              if (newDateRange?.from) {
                handleFilterChange('date', newDateRange.from);
              } else {
                // If date is cleared, update filters
                const newFilters = { ...filters };
                delete newFilters.date;
                setFilters(newFilters);
                
                // Create new external filters without the date
                const externalFilters: OrderFilters = {};
                if (filters.categoryId && filters.categoryId !== 'all') externalFilters.categoryId = filters.categoryId;
                if (filters.pickupLocation && filters.pickupLocation !== 'all') externalFilters.pickupLocation = filters.pickupLocation;
                if (filters.fulfillmentType && filters.fulfillmentType !== 'all') externalFilters.fulfillmentType = filters.fulfillmentType;
                onFilterChange(externalFilters);
              }
            }}
            mode="single"
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
