import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface OrderFiltersProps {
  onFilterChange: (filters: OrderFilters) => void;
  categories: { id: string; name: string }[];
  pickupLocations: string[];
}

export interface OrderFilters {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  pickupLocation?: string;
  pickupTime?: string;
}

export function OrderFilters({ onFilterChange, categories, pickupLocations }: OrderFiltersProps) {
  const [filters, setFilters] = useState<OrderFilters>({});

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const formatDateForInput = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Pickup Date Range</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={filters.dateFrom ? formatDateForInput(filters.dateFrom) : ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full"
            />
            <span>to</span>
            <Input
              type="date"
              value={filters.dateTo ? formatDateForInput(filters.dateTo) : ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
              className="w-full"
            />
          </div>
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
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
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
              {pickupLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}