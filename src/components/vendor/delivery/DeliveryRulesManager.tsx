import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { useDeliveryRules } from '@/hooks/vendor/useDeliveryRules';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function DeliveryRulesManager() {
  const { deliveryRules, upsertDeliveryRule, deleteDeliveryRule } = useDeliveryRules();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [minimumItems, setMinimumItems] = useState<number>(1);

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddRule = () => {
    if (selectedCategoryId && minimumItems > 0) {
      upsertDeliveryRule.mutate({
        category_id: selectedCategoryId,
        minimum_items: minimumItems,
        is_active: true,
      });
      setSelectedCategoryId('');
      setMinimumItems(1);
    }
  };

  const handleUpdateRule = (ruleId: string, field: 'minimum_items' | 'is_active', value: number | boolean) => {
    const rule = deliveryRules.find(r => r.id === ruleId);
    if (rule) {
      upsertDeliveryRule.mutate({
        ...rule,
        [field]: value,
      });
    }
  };

  const availableCategories = categories.filter(
    cat => !deliveryRules.some(rule => rule.category_id === cat.id)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Requirements</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set minimum item requirements for delivery availability by category. 
            Customers can only choose delivery if their cart meets these requirements.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new rule */}
          <div className="flex gap-4 items-end p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="minimum">Minimum Items</Label>
              <Input
                id="minimum"
                type="number"
                min="1"
                value={minimumItems}
                onChange={(e) => setMinimumItems(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button 
              onClick={handleAddRule}
              disabled={!selectedCategoryId || minimumItems < 1 || availableCategories.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {/* Existing rules */}
          <div className="space-y-3">
            {deliveryRules.map((rule) => {
              const category = categories.find(c => c.id === rule.category_id);
              return (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{category?.name || 'Unknown Category'}</div>
                    <div className="text-sm text-muted-foreground">
                      Minimum {rule.minimum_items} items required for delivery
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`items-${rule.id}`} className="text-sm">Items:</Label>
                      <Input
                        id={`items-${rule.id}`}
                        type="number"
                        min="1"
                        value={rule.minimum_items}
                        onChange={(e) => handleUpdateRule(rule.id, 'minimum_items', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${rule.id}`} className="text-sm">Active:</Label>
                      <Switch
                        id={`active-${rule.id}`}
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleUpdateRule(rule.id, 'is_active', checked)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDeliveryRule.mutate(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {deliveryRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No delivery rules configured. Add a rule above to enable conditional delivery.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
