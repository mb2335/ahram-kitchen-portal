
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliverySettingsManager } from "./DeliverySettingsManager";
import { PickupSettingsManager } from "./PickupSettingsManager";
import { Category } from "../types/category";

interface FulfillmentSettingsProps {
  categories: Category[];
}

export function FulfillmentSettings({ categories }: FulfillmentSettingsProps) {
  const [activeTab, setActiveTab] = useState<string>("delivery");
  
  const deliveryCategories = categories.filter(
    cat => cat.fulfillment_types.includes('delivery')
  );
  
  const pickupCategories = categories.filter(
    cat => cat.fulfillment_types.includes('pickup')
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fulfillment Settings</h2>
        <p className="text-muted-foreground mb-6">
          Configure your delivery and pickup options for each category.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="delivery">Delivery Settings</TabsTrigger>
          <TabsTrigger value="pickup">Pickup Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Time Slots</CardTitle>
              <CardDescription>
                Configure available delivery time slots for each category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryCategories.length > 0 ? (
                <DeliverySettingsManager categories={deliveryCategories} />
              ) : (
                <div className="text-center py-6 bg-muted/20 rounded-md">
                  <p>No categories are configured for delivery.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add delivery as a fulfillment type to categories to manage delivery settings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pickup">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Locations & Times</CardTitle>
              <CardDescription>
                Configure pickup days, locations and times for each category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pickupCategories.length > 0 ? (
                <PickupSettingsManager categories={pickupCategories} />
              ) : (
                <div className="text-center py-6 bg-muted/20 rounded-md">
                  <p>No categories are configured for pickup.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add pickup as a fulfillment type to categories to manage pickup settings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
