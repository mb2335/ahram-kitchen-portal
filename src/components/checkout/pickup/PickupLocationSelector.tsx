
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatTime } from "@/types/delivery";
import { PickupDetail } from "@/types/pickup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from 'date-fns';
import { Category } from "@/components/vendor/menu/types/category";
import { Clock } from "lucide-react";

interface PickupLocationSelectorProps {
  selectedDate: Date;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (detail: PickupDetail) => void;
  category: Category | null;
  allPickupCategories: Category[];
}

export function PickupLocationSelector({
  selectedDate,
  selectedPickupDetail,
  onPickupDetailChange,
  category,
  allPickupCategories,
}: PickupLocationSelectorProps) {
  const { t } = useLanguage();
  const isoDate = selectedDate?.toISOString();

  const { data: pickupSettings = [] } = useQuery({
    queryKey: ['pickup-settings', isoDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      // Get day of week (0 = Sunday, 1 = Monday, etc)
      const dayOfWeek = selectedDate.getDay(); 
      
      try {
        // Get global pickup settings for the selected day
        const { data: globalSettings, error } = await supabase
          .from('pickup_settings')
          .select('*')
          .eq('day', dayOfWeek);
          
        if (error) throw error;
        
        // Transform to PickupDetail format
        const pickupDetails = globalSettings.map(setting => ({
          id: setting.id,
          day: setting.day,
          time: setting.time || setting.start_time || '',
          start_time: setting.start_time || setting.time || '',
          end_time: setting.end_time || ''
        }));
        
        return pickupDetails;
      } catch (error) {
        console.error('Error fetching pickup settings:', error);
        return [];
      }
    },
    enabled: !!selectedDate,
  });

  // Format time range for display
  const formatTimeRange = (detail: PickupDetail): string => {
    const startTime = formatTime(detail.start_time || detail.time || '');
    if (!detail.end_time) return startTime;
    
    const endTime = formatTime(detail.end_time);
    return `${startTime} - ${endTime}`;
  };

  if (pickupSettings.length === 0) {
    return (
      <div className="text-center p-4 bg-muted/20 rounded-md">
        <p className="text-muted-foreground">{t('checkout.pickup.no_locations')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedPickupDetail?.id || ""}
        onValueChange={(value) => {
          const selected = pickupSettings.find(setting => setting.id === value);
          if (selected) {
            onPickupDetailChange({
              ...selected,
              day: selectedDate.getDay(), // Use the actual selected date's day
            });
          }
        }}
      >
        <div className="grid grid-cols-1 gap-3">
          {pickupSettings.map((setting) => (
            <div
              key={setting.id}
              className={`relative border rounded-md transition-all duration-200 cursor-pointer hover:bg-secondary/10 ${
                selectedPickupDetail?.id === setting.id
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "border-muted"
              }`}
              onClick={() => {
                onPickupDetailChange({
                  ...setting,
                  day: selectedDate.getDay(),
                });
              }}
            >
              <RadioGroupItem
                value={setting.id || ""}
                id={`location-${setting.id}`}
                className="peer sr-only"
              />
              
              <div className="p-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-muted-foreground mr-2" /> 
                  <span className="text-sm text-muted-foreground">{formatTimeRange(setting)}</span>
                </div>
              </div>
              
              {selectedPickupDetail?.id === setting.id && (
                <div className="absolute -right-1 -top-1 h-4 w-4 bg-primary rounded-full border-2 border-background"></div>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
