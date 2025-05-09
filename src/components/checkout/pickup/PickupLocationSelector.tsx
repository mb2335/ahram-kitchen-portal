
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PickupDetail } from '@/types/pickup';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatTime } from '@/types/delivery';

interface PickupLocationSelectorProps {
  category: {
    id: string;
    name: string;
    name_ko: string;
    has_custom_pickup: boolean | null;
  } | null;
  selectedDate: Date;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  allPickupCategories: { name: string; name_ko: string }[] | null[];
  className?: string;
}

export function PickupLocationSelector({
  category,
  selectedDate,
  selectedPickupDetail,
  onPickupDetailChange,
  allPickupCategories,
  className
}: PickupLocationSelectorProps) {
  const { language } = useLanguage();
  const [availablePickupDetails, setAvailablePickupDetails] = useState<PickupDetail[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Calculate day of week from selected date
  const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
  
  // Query pickup settings for the selected day - globally without vendor filtering
  const { data: pickupSettings = [], isLoading } = useQuery({
    queryKey: ['pickup-settings', dayOfWeek],
    queryFn: async () => {
      if (dayOfWeek < 0) return [];
      
      console.log(`Fetching pickup settings for day ${dayOfWeek}`);
      
      try {
        // Fetch ALL pickup settings for the selected day without any vendor filtering
        const { data, error } = await supabase
          .from('pickup_settings')
          .select('*')
          .eq('day', dayOfWeek);
        
        if (error) {
          console.error(`Error fetching pickup settings for day ${dayOfWeek}:`, error);
          return [];
        }
        
        console.log(`Found ${data?.length || 0} pickup settings for day ${dayOfWeek}`, data);
        return data || [];
      } catch (err) {
        console.error(`Exception fetching pickup settings:`, err);
        return [];
      }
    },
    enabled: dayOfWeek >= 0,
  });

  // Process pickup settings once they're loaded
  useEffect(() => {
    if (!selectedDate) {
      setAvailablePickupDetails([]);
      setError(null);
      return;
    }
    
    if (!pickupSettings || pickupSettings.length === 0) {
      setAvailablePickupDetails([]);
      setError(`No pickup locations are available for this date. Please select another date.`);
      return;
    }
    
    // Map pickup settings to pickup details - using all available settings
    let details = pickupSettings.map(setting => ({
      day: setting.day,
      time: setting.time || '',
      location: setting.location || ''
    }));
    
    // Sort details by time in ascending order
    details = details.sort((a, b) => {
      // Convert time strings to comparable values (minutes since midnight)
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60) + minutes;
      };
      
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    setAvailablePickupDetails(details);
    setError(null);
    
    // If we have a selected pickup detail, check if it's still valid
    if (selectedPickupDetail) {
      const stillAvailable = details.some(
        d => d.location === selectedPickupDetail.location && 
             d.time === selectedPickupDetail.time &&
             d.day === selectedPickupDetail.day
      );
      
      if (!stillAvailable && details.length > 0) {
        // Auto-select the first available option if current selection is invalid
        handleLocationSelect(`${details[0].location}-${details[0].time}`);
      } else if (!stillAvailable) {
        setSelectedLocation('');
      } else {
        // Ensure the selection is reflected in the UI
        setSelectedLocation(`${selectedPickupDetail.location}-${selectedPickupDetail.time}`);
      }
    } else if (details.length > 0) {
      // Auto-select the first option if none is selected yet
      handleLocationSelect(`${details[0].location}-${details[0].time}`);
    }
  }, [pickupSettings, selectedDate]);  // Removed selectedPickupDetail from dependencies to avoid infinite loop

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

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading pickup locations...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (availablePickupDetails.length === 0) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No pickup locations available for this date.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label>Pickup Location & Time</Label>
      <Select 
        value={selectedLocation} 
        onValueChange={handleLocationSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select pickup location and time" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-[200px]">
            {availablePickupDetails.map((detail, index) => (
              <SelectItem 
                key={index} 
                value={`${detail.location}-${detail.time}`}
              >
                {detail.location} - {formatTime(detail.time)}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
