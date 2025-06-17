
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { SimplePickupManager } from "@/components/vendor/pickup/SimplePickupManager";
import { DeliverySettingsManager } from "./DeliverySettingsManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSimplePickupSettings } from "@/hooks/vendor/useSimplePickupSettings";
import { Category } from "@/components/vendor/menu/types/category";

export function EnhancedFulfillmentSettings() {
  // Fetch all categories
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

  const {
    schedules,
    isLoading: isLoadingPickup,
    saveSchedule,
  } = useSimplePickupSettings();

  if (isLoadingPickup) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fulfillment Settings</h2>
        <p className="text-muted-foreground mb-6">
          Configure your delivery and pickup schedule.
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="delivery">
          <TabsList>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delivery" className="mt-6">
            <DeliverySettingsManager />
          </TabsContent>
          
          <TabsContent value="pickup" className="mt-6">
            <SimplePickupManager
              schedules={schedules}
              onSaveSchedule={(schedule) => saveSchedule.mutate(schedule)}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
