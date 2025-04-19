
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

  // Simple query to fetch all pickup settings for the selected day
  const { data: pickupSettings = [], isLoading } = useQuery({
    queryKey: ['pickup-settings', selectedDate?.getDay()],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dayOfWeek = selectedDate.getDay();
      
      console.log(`Fetching pickup settings for day ${dayOfWeek}`);
      
      try {
        // Fetch all pickup settings for the selected day without any vendor filtering
        const { data, error } = await supabase
          .from('pickup_settings')
          .select('*')
          .eq('day', dayOfWeek);
        
        if (error) {
          console.error(`Error fetching pickup settings for day ${dayOfWeek}:`, error);
          return [];
        }
        
        console.log(`Found ${data?.length || 0} pickup settings for day ${dayOfWeek}`);
        return data || [];
      } catch (err) {
        console.error(`Exception fetching pickup settings:`, err);
        return [];
      }
    },
    enabled: !!selectedDate,
  });

  useEffect(() => {
    if (!selectedDate) {
      setAvailablePickupDetails([]);
      setError("Please select a pickup date first");
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    
    if (pickupSettings.length === 0) {
      setAvailablePickupDetails([]);
      setError(`No pickup locations are available for this date. Please select another date.`);
      return;
    }
    
    // Map pickup settings to pickup details
    const details = pickupSettings.map(setting => ({
      day: setting.day,
      time: setting.time || '',
      location: setting.location || ''
    }));
    
    console.log(`Found ${details.length} pickup details for day ${dayOfWeek}`);
    setAvailablePickupDetails(details);
    setError(null);
    
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
  }, [selectedDate, pickupSettings, selectedPickupDetail, onPickupDetailChange]);

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
                {detail.location} - {detail.time}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}
