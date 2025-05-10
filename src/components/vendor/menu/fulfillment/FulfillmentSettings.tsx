
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DeliverySettingsManager } from "./DeliverySettingsManager";
import { PickupSettingsManager } from "@/components/vendor/menu/fulfillment/PickupSettingsManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/components/vendor/menu/types/category";

export function FulfillmentSettings() {
  // Fetch all categories without filtering by vendor
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      
      return data as Category[];
    },
  });

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
            <PickupSettingsManager categories={categories} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
