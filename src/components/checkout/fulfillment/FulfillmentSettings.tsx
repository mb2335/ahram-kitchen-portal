
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Package as PackageIcon, Truck as TruckIcon } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch delivery settings
  const { data: deliverySettings } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('*')
          .limit(1);
          
        if (error || !data || data.length === 0) {
          console.error('Error or no data when fetching delivery settings:', error);
          return null;
        }
        
        console.log("Fetched delivery settings:", data[0]);
        return data[0];
      } catch (err) {
        console.error('Exception fetching delivery settings:', err);
        return null;
      }
    },
  });

  // Fetch ALL pickup settings globally - without ANY vendor filtering
  const { data: pickupSettings = [], isLoading: isLoadingPickup } = useQuery({
    queryKey: ['pickup-settings'],
    queryFn: async () => {
      try {
        console.log('Fetching all pickup settings globally');
        
        const { data, error } = await supabase
          .from('pickup_settings')
          .select('*');
        
        if (error) {
          console.error('Error fetching pickup settings:', error);
          return [];
        }
        
        console.log(`Fetched ${data?.length || 0} global pickup settings:`, data);
        return data || [];
      } catch (err) {
        console.error('Exception fetching pickup settings:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Create sets of available days for each fulfillment type
  const availablePickupDays = useMemo(() => {
    if (!pickupSettings || pickupSettings.length === 0) {
      console.log("No pickup settings found, returning empty set");
      return new Set();
    }
    
    const days = new Set(pickupSettings.map(setting => setting.day));
    console.log("Available pickup days:", Array.from(days));
    return days;
  }, [pickupSettings]);

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
    if (isLoading) return;
    
    if (usedFulfillmentTypes.has(FULFILLMENT_TYPE_PICKUP) && pickupSettings.length > 0) {
      console.log("Updating pickup dates based on settings:", pickupSettings.length);
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
      } else if (!currentPickupDate && availablePickupDays.size > 0) {
        // Auto-select first available date if none selected
        const today = new Date();
        let foundDate = false;
        
        for (let i = 0; i < 14; i++) {
          const checkDate = addDays(today, i);
          if (isDateAvailable(checkDate, FULFILLMENT_TYPE_PICKUP)) {
            onDateChange(FULFILLMENT_TYPE_PICKUP, checkDate);
            foundDate = true;
            break;
          }
        }
        
        if (!foundDate) {
          console.warn("No available pickup dates found in the next 14 days");
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
      } else if (!currentDeliveryDate && availableDeliveryDays.size > 0) {
        // Auto-select first available date if none selected
        const today = new Date();
        let foundDate = false;
        
        for (let i = 0; i < 14; i++) {
          const checkDate = addDays(today, i);
          if (isDateAvailable(checkDate, FULFILLMENT_TYPE_DELIVERY)) {
            onDateChange(FULFILLMENT_TYPE_DELIVERY, checkDate);
            foundDate = true;
            break;
          }
        }
        
        if (!foundDate) {
          console.warn("No available delivery dates found in the next 14 days");
        }
      }
    }
  }, [availablePickupDays, availableDeliveryDays, usedFulfillmentTypes, selectedDates, onDateChange, pickupSettings.length, isLoading]);

  if (isLoading || isLoadingPickup) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md border-opacity-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-muted-foreground">Loading fulfillment options...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <PackageIcon className="h-5 w-5" /> Pickup Settings
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Pickup Date</Label>
                  {availablePickupDays.size === 0 ? (
                    <Alert variant="default" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No pickup days are currently available. Please contact the vendor.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div>
                      <DatePicker
                        date={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                        onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_PICKUP, date)}
                        disabled={(date) => !isDateAvailable(date, FULFILLMENT_TYPE_PICKUP)}
                      />
                    </div>
                  )}
                </div>
                {selectedDates[FULFILLMENT_TYPE_PICKUP] && (
                  <div className="border-l border-secondary/30 pl-4">
                    <div>
                      <PickupLocationSelector
                        selectedDate={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                        selectedPickupDetail={selectedPickupDetail}
                        onPickupDetailChange={onPickupDetailChange}
                        category={null}
                        allPickupCategories={[]}
                      />
                    </div>
                  </div>
                )}
              </div>
              <Separator className="my-4 bg-secondary/50" />
            </div>
          )}

          {usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY) && (
            <div className="space-y-4 bg-accent/10 p-4 rounded-lg">
              <h3 className="font-medium text-primary text-lg flex items-center gap-2">
                <TruckIcon className="h-5 w-5" /> Delivery Settings
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Delivery Date</Label>
                  {availableDeliveryDays.size === 0 ? (
                    <Alert variant="default" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No delivery days are currently available. Please contact the vendor.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div>
                      <DatePicker
                        date={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                        onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_DELIVERY, date)}
                        disabled={(date) => !isDateAvailable(date, FULFILLMENT_TYPE_DELIVERY)}
                      />
                    </div>
                  )}
                </div>
                {selectedDates[FULFILLMENT_TYPE_DELIVERY] && (
                  <div className="border-l border-accent/30 pl-4">
                    <div>
                      <DeliveryTimeSlotSelector
                        categoryId="global"
                        categoryName="Delivery"
                        selectedDate={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                        selectedTimeSlot={selectedTimeSlot || null}
                        onTimeSlotChange={onDeliveryTimeSlotChange}
                      />
                    </div>
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
