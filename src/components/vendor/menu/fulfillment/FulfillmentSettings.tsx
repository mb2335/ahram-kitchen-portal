
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DeliverySettingsManager } from "./DeliverySettingsManager";
import { PickupSettingsManager } from "./PickupSettingsManager";

export function FulfillmentSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fulfillment Settings</h2>
        <p className="text-muted-foreground mb-6">
          Configure your delivery and pickup options.
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="delivery">
          <TabsList>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delivery">
            <DeliverySettingsManager />
          </TabsContent>
          
          <TabsContent value="pickup">
            <PickupSettingsManager />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
