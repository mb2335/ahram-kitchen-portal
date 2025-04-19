import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from "@/types/order";
import { DeliveryTimeSlotSelector } from "../DeliveryTimeSlotSelector";
import { PickupLocationSelector } from "../pickup/PickupLocationSelector";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isSameDay } from "date-fns";
import { useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package, Truck } from "lucide-react";
import { PickupDetail } from "@/types/pickup";

interface FulfillmentSettingsProps {
  selectedDates: Record<string, Date>;
  onDateChange: (type: string, date: Date) => void;
  onPickupDetailChange: (detail: PickupDetail) => void;
  selectedPickupDetail: PickupDetail | null;
  onDeliveryTimeSlotChange?: (timeSlot: string) => void;
  selectedTimeSlot?: string | null;
  usedFulfillmentTypes: Set<string>;
}

export function FulfillmentSettings({
  selectedDates,
  onDateChange,
  onPickupDetailChange,
  selectedPickupDetail,
  onDeliveryTimeSlotChange,
  selectedTimeSlot,
  usedFulfillmentTypes
}: FulfillmentSettingsProps) {
  // Fetch vendor delivery settings to determine available days
  const { data: deliverySettings } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('*')
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching delivery settings:', error);
        throw error;
      }
      return data;
    },
  });

  // Fetch pickup settings to determine available days
  const { data: pickupSettings = [] } = useQuery({
    queryKey: ['pickup-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pickup_settings')
        .select('*')
        .order('day');
      
      if (error) throw error;
      return data;
    },
  });

  // Create sets of available days for each fulfillment type
  const availablePickupDays = useMemo(() => 
    new Set(pickupSettings.map(setting => setting.day)),
    [pickupSettings]
  );

  const availableDeliveryDays = useMemo(() => 
    new Set(deliverySettings?.active_days || []),
    [deliverySettings]
  );

  // Filter date picker to only show available dates based on fulfillment type
  const isDateAvailable = (date: Date, fulfillmentType: string) => {
    const dayOfWeek = date.getDay();
    
    // Don't allow dates in the past
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return false;
    }
    
    // Don't allow dates more than 14 days in the future
    const maxDate = addDays(new Date(new Date().setHours(0, 0, 0, 0)), 14);
    if (date > maxDate) {
      return false;
    }

    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      return availablePickupDays.has(dayOfWeek);
    } else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
      return availableDeliveryDays.has(dayOfWeek);
    }
    
    return true;
  };

  // Make sure selected dates are still valid based on vendor settings
  useEffect(() => {
    if (usedFulfillmentTypes.has(FULFILLMENT_TYPE_PICKUP)) {
      const currentPickupDate = selectedDates[FULFILLMENT_TYPE_PICKUP];
      if (currentPickupDate && !isDateAvailable(currentPickupDate, FULFILLMENT_TYPE_PICKUP)) {
        // Find the next available pickup date
        let nextDate = new Date();
        for (let i = 0; i < 14; i++) {
          nextDate = addDays(nextDate, 1);
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_PICKUP)) {
            onDateChange(FULFILLMENT_TYPE_PICKUP, nextDate);
            break;
          }
        }
      }
    }

    if (usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY)) {
      const currentDeliveryDate = selectedDates[FULFILLMENT_TYPE_DELIVERY];
      if (currentDeliveryDate && !isDateAvailable(currentDeliveryDate, FULFILLMENT_TYPE_DELIVERY)) {
        // Find the next available delivery date
        let nextDate = new Date();
        for (let i = 0; i < 14; i++) {
          nextDate = addDays(nextDate, 1);
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_DELIVERY)) {
            onDateChange(FULFILLMENT_TYPE_DELIVERY, nextDate);
            break;
          }
        }
      }
    }
  }, [availablePickupDays, availableDeliveryDays, usedFulfillmentTypes, selectedDates]);

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-opacity-50 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="bg-secondary/20 py-4">
          <CardTitle className="text-xl font-semibold text-primary">
            Fulfillment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {usedFulfillmentTypes.has(FULFILLMENT_TYPE_PICKUP) && (
            <div className="space-y-4 bg-secondary/10 p-4 rounded-lg">
              <h3 className="font-medium text-primary text-lg flex items-center gap-2">
                <Package className="h-5 w-5" /> Pickup Settings
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Pickup Date</Label>
                  {availablePickupDays.size === 0 ? (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No pickup days are currently available. Please contact the vendor.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <DatePicker
                      date={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                      onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_PICKUP, date)}
                      disabled={(date) => !isDateAvailable(date, FULFILLMENT_TYPE_PICKUP)}
                    />
                  )}
                </div>
                {selectedDates[FULFILLMENT_TYPE_PICKUP] && (
                  <div className="border-l border-secondary/30 pl-4">
                    <PickupLocationSelector
                      selectedDate={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                      selectedPickupDetail={selectedPickupDetail}
                      onPickupDetailChange={onPickupDetailChange}
                      category={null}
                      allPickupCategories={[]}
                    />
                  </div>
                )}
              </div>
              <Separator className="my-4 bg-secondary/50" />
            </div>
          )}

          {usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY) && (
            <div className="space-y-4 bg-accent/10 p-4 rounded-lg">
              <h3 className="font-medium text-primary text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" /> Delivery Settings
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Delivery Date</Label>
                  {availableDeliveryDays.size === 0 ? (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No delivery days are currently available. Please contact the vendor.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <DatePicker
                      date={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                      onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_DELIVERY, date)}
                      disabled={(date) => !isDateAvailable(date, FULFILLMENT_TYPE_DELIVERY)}
                    />
                  )}
                </div>
                {selectedDates[FULFILLMENT_TYPE_DELIVERY] && (
                  <div className="border-l border-accent/30 pl-4">
                    <DeliveryTimeSlotSelector
                      categoryId="global"
                      categoryName="Delivery"
                      selectedDate={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                      selectedTimeSlot={selectedTimeSlot || null}
                      onTimeSlotChange={onDeliveryTimeSlotChange}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
