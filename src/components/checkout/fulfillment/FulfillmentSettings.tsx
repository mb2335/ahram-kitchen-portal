
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from "@/types/order";
import { DeliveryTimeSlotSelector } from "../DeliveryTimeSlotSelector";
import { PickupLocationSelector } from "../pickup/PickupLocationSelector";
import { Separator } from "@/components/ui/separator";

interface FulfillmentSettingsProps {
  selectedDates: Record<string, Date>;
  onDateChange: (type: string, date: Date) => void;
  onPickupDetailChange: (detail: any) => void;
  selectedPickupDetail: any;
  onDeliveryTimeSlotChange?: (timeSlot: string) => void;
  selectedTimeSlot?: string;
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fulfillment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {usedFulfillmentTypes.has(FULFILLMENT_TYPE_PICKUP) && (
            <div className="space-y-4">
              <h3 className="font-medium">Pickup Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Pickup Date</Label>
                  <DatePicker
                    date={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                    onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_PICKUP, date)}
                  />
                </div>
                {selectedDates[FULFILLMENT_TYPE_PICKUP] && (
                  <PickupLocationSelector
                    selectedDate={selectedDates[FULFILLMENT_TYPE_PICKUP]}
                    selectedPickupDetail={selectedPickupDetail}
                    onPickupDetailChange={onPickupDetailChange}
                    category={null}
                    allPickupCategories={[]}
                  />
                )}
              </div>
              <Separator />
            </div>
          )}

          {usedFulfillmentTypes.has(FULFILLMENT_TYPE_DELIVERY) && (
            <div className="space-y-4">
              <h3 className="font-medium">Delivery Settings</h3>
              <div className="grid gap-4">
                <div>
                  <Label>Delivery Date</Label>
                  <DatePicker
                    date={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                    onSelect={(date) => date && onDateChange(FULFILLMENT_TYPE_DELIVERY, date)}
                  />
                </div>
                {selectedDates[FULFILLMENT_TYPE_DELIVERY] && (
                  <DeliveryTimeSlotSelector
                    categoryId="global"
                    categoryName="Delivery"
                    selectedDate={selectedDates[FULFILLMENT_TYPE_DELIVERY]}
                    selectedTimeSlot={selectedTimeSlot}
                    onTimeSlotChange={onDeliveryTimeSlotChange}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
