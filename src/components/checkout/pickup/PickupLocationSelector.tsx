
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PickupDetail } from '@/types/pickup';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PickupLocationSelectorProps {
  category: {
    id: string;
    name: string;
    name_ko: string;
    has_custom_pickup: boolean | null;
    pickup_details: PickupDetail[];
  };
  selectedDate: Date;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  allPickupCategories: { name: string; name_ko: string }[] | null[];
}

export function PickupLocationSelector({
  category,
  selectedDate,
  selectedPickupDetail,
  onPickupDetailChange,
  allPickupCategories,
}: PickupLocationSelectorProps) {
  const { language } = useLanguage();
  const [availablePickupDetails, setAvailablePickupDetails] = useState<PickupDetail[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  useEffect(() => {
    if (!category?.pickup_details || !selectedDate) {
      setAvailablePickupDetails([]);
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    const details = category.pickup_details.filter(detail => detail.day === dayOfWeek);
    
    setAvailablePickupDetails(details);
    
    // Reset selection if current selection is not available
    if (selectedPickupDetail) {
      const stillAvailable = details.some(
        d => d.location === selectedPickupDetail.location && d.time === selectedPickupDetail.time
      );
      
      if (!stillAvailable) {
        setSelectedLocation('');
        onPickupDetailChange({
          day: dayOfWeek,
          time: '',
          location: ''
        });
      }
    }
  }, [category, selectedDate, selectedPickupDetail, onPickupDetailChange]);

  const handleLocationSelect = (value: string) => {
    setSelectedLocation(value);
    
    const selectedDetail = availablePickupDetails.find(detail => 
      `${detail.location}-${detail.time}` === value
    );
    
    if (selectedDetail) {
      onPickupDetailChange({
        day: selectedDetail.day,
        time: selectedDetail.time,
        location: selectedDetail.location
      });
    }
  };

  if (availablePickupDetails.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No pickup locations available for this date.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Pickup Location & Time</Label>
      <Select 
        value={selectedLocation} 
        onValueChange={handleLocationSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select pickup location and time" />
        </SelectTrigger>
        <SelectContent>
          {availablePickupDetails.map((detail, index) => (
            <SelectItem 
              key={index} 
              value={`${detail.location}-${detail.time}`}
            >
              {detail.location} - {detail.time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
