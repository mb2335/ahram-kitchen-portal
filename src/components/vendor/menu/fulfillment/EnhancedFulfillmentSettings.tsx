
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RuleGroupManager } from "@/components/vendor/delivery/RuleGroupManager";
import { SimplePickupManager } from "@/components/vendor/pickup/SimplePickupManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedDeliveryRules } from "@/hooks/vendor/useEnhancedDeliveryRules";
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
    ruleGroups,
    isLoading: isLoadingRules,
    saveRuleGroup,
    deleteRuleGroup,
    toggleRuleGroup,
  } = useEnhancedDeliveryRules();

  const {
    schedules,
    isLoading: isLoadingPickup,
    saveSchedule,
  } = useSimplePickupSettings();

  if (isLoadingRules || isLoadingPickup) {
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
          Configure your delivery rules and pickup schedule.
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="delivery">
          <TabsList>
            <TabsTrigger value="delivery">Delivery Rules</TabsTrigger>
            <TabsTrigger value="pickup">In-Store Pickup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="delivery" className="mt-6">
            <RuleGroupManager
              ruleGroups={ruleGroups}
              categories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
              onSaveRuleGroup={(group) => saveRuleGroup.mutate(group)}
              onDeleteRuleGroup={(groupId) => deleteRuleGroup.mutate(groupId)}
              onToggleRuleGroup={(groupId, active) => toggleRuleGroup.mutate({ groupId, active })}
            />
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
