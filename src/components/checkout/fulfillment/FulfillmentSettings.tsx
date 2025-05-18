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
import { AlertCircle, Package as PackageIcon, Truck as TruckIcon, RefreshCcw } from "lucide-react";
import { PickupDetail } from "@/types/pickup";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/types/delivery";

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
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 8000); // 8 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Fetch delivery settings
  const { 
    data: deliverySettings, 
    refetch: refetchDeliverySettings, 
    isError: isDeliveryError,
    isLoading: isLoadingDelivery 
  } = useQuery({
    queryKey: ['vendor-delivery-settings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('*')
          .limit(1);
          
        if (error) {
          console.error('Error when fetching delivery settings:', error);
          return null;
        }
        
        if (!data || data.length === 0) {
          console.log("No delivery settings found");
          return null;
        }
        
        console.log("Fetched delivery settings:", data[0]);
        return data[0];
      } catch (err) {
        console.error('Exception fetching delivery settings:', err);
        return null;
      }
    },
    retry: 2,  // Retry failed requests up to 2 times
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Fetch ALL pickup settings globally - without ANY vendor filtering
  const { 
    data: pickupSettings = [], 
    isLoading: isLoadingPickup, 
    refetch: refetchPickupSettings,
    isError: isPickupError
  } = useQuery({
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
        
        if (!data || data.length === 0) {
          console.log("No pickup settings found");
          return [];
        }
        
        console.log(`Fetched ${data.length} global pickup settings:`, data);
        return data;
      } catch (err) {
        console.error('Exception fetching pickup settings:', err);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    staleTime: 60000, // Consider data fresh for 1 minute
  });

  // Update loading state based on query states
  useEffect(() => {
    // Set loading to false only when both queries have completed (success or error)
    if (!isLoadingDelivery && !isLoadingPickup) {
      setIsLoading(false);
    }
  }, [isLoadingDelivery, isLoadingPickup]);
  
  // Function to retry fetching data when failed
  const handleRetryFetch = () => {
    setIsLoading(true);
    setLoadingTimeout(false);
    refetchDeliverySettings();
    refetchPickupSettings();
  };

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

  // Format time range for display
  const formatTimeRange = (detail: PickupDetail): string => {
    const startTime = formatTime(detail.start_time || detail.time || '');
    if (!detail.end_time) return startTime;
    
    const endTime = formatTime(detail.end_time);
    return `${startTime} - ${endTime}`;
  };

  // Filter date picker to only show available dates based on fulfillment type
  const isDateAvailable = (date: Date, fulfillmentType: string) => {
    const dayOfWeek = date.getDay();
    
    // Get tomorrow's date (to prevent same-day orders)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Don't allow dates in the past or today (same-day)
    if (date < tomorrow) {
      return false;
    }
    
    // For pickup - limit to max 7 days in the future
    if (fulfillmentType === FULFILLMENT_TYPE_PICKUP) {
      const maxPickupDate = addDays(new Date(new Date().setHours(0, 0, 0, 0)), 7);
      if (date > maxPickupDate) {
        return false;
      }
      return availablePickupDays.has(dayOfWeek);
    } 
    // For delivery - keep existing 14-day limit
    else if (fulfillmentType === FULFILLMENT_TYPE_DELIVERY) {
      const maxDate = addDays(new Date(new Date().setHours(0, 0, 0, 0)), 14);
      if (date > maxDate) {
        return false;
      }
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
      
      // Get tomorrow's date (to prevent same-day orders)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (currentPickupDate && (!isDateAvailable(currentPickupDate, FULFILLMENT_TYPE_PICKUP) || currentPickupDate < tomorrow)) {
        // Find the next available pickup date (starting from tomorrow)
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow
        for (let i = 0; i < 7; i++) { // Only look 7 days ahead for pickup
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_PICKUP)) {
            onDateChange(FULFILLMENT_TYPE_PICKUP, nextDate);
            break;
          }
          nextDate = addDays(nextDate, 1);
        }
      } else if (!currentPickupDate && availablePickupDays.size > 0) {
        // Auto-select first available date if none selected (starting from tomorrow)
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow
        let foundDate = false;
        
        for (let i = 0; i < 7; i++) { // Only look 7 days ahead for pickup
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_PICKUP)) {
            onDateChange(FULFILLMENT_TYPE_PICKUP, nextDate);
            foundDate = true;
            break;
          }
          nextDate = addDays(nextDate, 1);
        }
        
        if (!foundDate) {
          console.warn("No available pickup dates found in the next 7 days");
        }
      }
    }

    if (usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY)) {
      const currentDeliveryDate = selectedDates[FULFILLMENT_TYPE_DELIVERY];
      
      // Get tomorrow's date (to prevent same-day orders)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (currentDeliveryDate && (!isDateAvailable(currentDeliveryDate, FULFILLMENT_TYPE_DELIVERY) || currentDeliveryDate < tomorrow)) {
        // Find the next available delivery date (starting from tomorrow)
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow
        for (let i = 0; i < 14; i++) { // Keep 14 days for delivery
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_DELIVERY)) {
            onDateChange(FULFILLMENT_TYPE_DELIVERY, nextDate);
            break;
          }
          nextDate = addDays(nextDate, 1);
        }
      } else if (!currentDeliveryDate && availableDeliveryDays.size > 0) {
        // Auto-select first available date if none selected (starting from tomorrow)
        let nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow
        let foundDate = false;
        
        for (let i = 0; i < 14; i++) { // Keep 14 days for delivery
          if (isDateAvailable(nextDate, FULFILLMENT_TYPE_DELIVERY)) {
            onDateChange(FULFILLMENT_TYPE_DELIVERY, nextDate);
            foundDate = true;
            break;
          }
          nextDate = addDays(nextDate, 1);
        }
        
        if (!foundDate) {
          console.warn("No available delivery dates found in the next 14 days");
        }
      }
    }
  }, [availablePickupDays, availableDeliveryDays, usedFulfillmentTypes, selectedDates, onDateChange, pickupSettings.length, isLoading]);

  // Determine if we're actually still loading or if there is an error
  const hasQueryError = (isDeliveryError && !deliverySettings) || (isPickupError && pickupSettings.length === 0);
  const isActuallyLoading = isLoading && !loadingTimeout && !hasQueryError;

  // If all data is loaded but has no valid content, show an error
  const hasNoValidData = !isActuallyLoading && availablePickupDays.size === 0 && availableDeliveryDays.size === 0;

  if (isActuallyLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md border-opacity-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40 flex-col gap-4">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mb-4 mx-auto"></div>
                <p className="text-muted-foreground">Loading fulfillment options...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show retry button for timeout or error states
  if (loadingTimeout || hasNoValidData || hasQueryError) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md border-opacity-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-40 flex-col gap-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {loadingTimeout 
                    ? "Failed to load fulfillment options in a timely manner." 
                    : "No fulfillment options available. Please contact the vendor."}
                </AlertDescription>
              </Alert>
              <Button 
                variant="outline" 
                onClick={handleRetryFetch}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
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
              
              {availablePickupDays.size === 0 ? (
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No pickup days are currently available. Please contact the vendor.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-6">
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Pickup Date</Label>
                    <DatePicker
                      date={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                      onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_PICKUP, date)}
                      disabled={(date) => !isDateAvailable(date, FULFILLMENT_TYPE_PICKUP)}
                    />
                  </div>
                  
                  {selectedDates[FULFILLMENT_TYPE_PICKUP] && (
                    <div className="mt-2">
                      <div className="bg-secondary/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-3">
                          Available pickup locations for {format(selectedDates[FULFILLMENT_TYPE_PICKUP], 'EEEE, MMMM d')}
                        </h4>
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
              )}
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
