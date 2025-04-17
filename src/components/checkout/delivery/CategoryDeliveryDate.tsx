import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from '@/types/order';
import { PickupLocationSelector } from '../pickup/PickupLocationSelector';
import { PickupDetail } from '@/types/pickup';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, addDays } from 'date-fns';
import { DeliveryTimeSlotSelector } from '../DeliveryTimeSlotSelector';
import { DeliveryTimeSlotSelection } from '@/types/delivery';

interface CategoryDeliveryDateProps {
  category: {
    id: string;
    name: string;
    name_ko: string;
    has_custom_pickup: boolean | null;
    pickup_details: any[];
    pickup_days: number[] | null;
    fulfillment_types: string[] | null;
  };
  selectedDate: Date | undefined;
  onDateChange: (date: Date) => void;
  selectedPickupDetail: PickupDetail | null;
  onPickupDetailChange: (pickupDetail: PickupDetail) => void;
  fulfillmentType: string;
  allPickupCategories: { name: string; name_ko: string }[] | null[];
}

export function CategoryDeliveryDate({
  category,
  selectedDate,
  onDateChange,
  selectedPickupDetail,
  onPickupDetailChange,
  fulfillmentType,
  allPickupCategories,
}: CategoryDeliveryDateProps) {
  const { t, language } = useLanguage();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  useEffect(() => {
    const timeSlotSelection = selectedDate && selectedTimeSlot ? {
      categoryId: category.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot
    } : null;
    
    if (window.localStorage) {
      if (timeSlotSelection) {
        window.localStorage.setItem(`timeSlot_${category.id}`, JSON.stringify({
          date: selectedDate?.toISOString(),
          timeSlot: selectedTimeSlot
        }));
      } else {
        window.localStorage.removeItem(`timeSlot_${category.id}`);
      }
    }
  }, [category.id, selectedDate, selectedTimeSlot]);

  useEffect(() => {
    if (window.localStorage) {
      const savedData = window.localStorage.getItem(`timeSlot_${category.id}`);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.date && parsed.timeSlot) {
            const savedDate = new Date(parsed.date);
            if (
              selectedDate && 
              format(savedDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            ) {
              setSelectedTimeSlot(parsed.timeSlot);
            } else {
              setSelectedTimeSlot(null);
            }
          }
        } catch (e) {
          console.error('Error parsing saved time slot data', e);
        }
      }
    }
  }, [category.id, selectedDate]);

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', category.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('menu_categories')
        .select('blocked_dates')
        .eq('id', category.id)
        .single();
      
      return data?.blocked_dates || [];
    },
  });

  const isPickup = fulfillmentType === FULFILLMENT_TYPE_PICKUP;
  const isDelivery = fulfillmentType === FULFILLMENT_TYPE_DELIVERY;
  const hasPickupConfig = category.has_custom_pickup;
  const pickupDays = category.pickup_days || [];
  
  const categoryName = language === 'en' ? category.name : category.name_ko || category.name;
  
  const isDateDisabled = (date: Date) => {
    if (!isAfter(date, addDays(new Date(), 0))) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    if (blockedDates.includes(dateString)) {
      return true;
    }
    
    if (isPickup) {
      const dayOfWeek = date.getDay();
      return !pickupDays.includes(dayOfWeek);
    }
    
    if (isDelivery) {
      const dayOfWeek = date.getDay();
      return pickupDays.includes(dayOfWeek);
    }
    
    return false;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">
        {categoryName}
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t('checkout.date')}</Label>
          <DatePicker
            date={selectedDate}
            onSelect={onDateChange}
            disabled={isDateDisabled}
          />
        </div>
        
        {isPickup && hasPickupConfig && selectedDate && (
          <div>
            <PickupLocationSelector
              category={category}
              selectedDate={selectedDate}
              selectedPickupDetail={selectedPickupDetail}
              onPickupDetailChange={onPickupDetailChange}
              allPickupCategories={allPickupCategories}
            />
          </div>
        )}
      </div>
      
      {isDelivery && selectedDate && (
        <DeliveryTimeSlotSelector
          categoryId={category.id}
          categoryName={categoryName}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          onTimeSlotChange={setSelectedTimeSlot}
        />
      )}
    </div>
  );
}
