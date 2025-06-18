
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

interface DeliveryRule {
  id: string;
  category_id: string;
  minimum_items: number;
  logical_operator: 'AND' | 'OR';
  rule_group_id: string;
  rule_group_name: string;
  is_active: boolean;
}

export const useEnhancedDeliveryEligibility = () => {
  const { items } = useCart();

  const { data: isDeliveryEligible = false, isLoading } = useQuery({
    queryKey: ['enhanced-delivery-eligibility', items],
    queryFn: async () => {
      if (items.length === 0) return false;

      // Get all active delivery rules
      const { data: deliveryRules, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching delivery rules:', error);
        return false;
      }

      if (!deliveryRules || deliveryRules.length === 0) {
        // If no rules are configured, delivery is available
        return true;
      }

      // Count items by category
      const itemsByCategory = items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        acc[categoryId] = (acc[categoryId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      console.log('Items by category:', itemsByCategory);

      // Group rules by rule_group_id
      const ruleGroups = (deliveryRules as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(rule);
        return acc;
      }, {} as Record<string, DeliveryRule[]>);

      console.log('Rule groups:', ruleGroups);

      // Check if any rule group is satisfied
      for (const [groupId, groupRules] of Object.entries(ruleGroups)) {
        console.log(`Evaluating rule group ${groupId}:`, groupRules);
        
        // Sort rules to ensure proper evaluation order
        const sortedRules = [...groupRules].sort((a, b) => {
          // First rule doesn't have a logical operator context, so we'll treat it as the base
          return 0;
        });

        let groupSatisfied = false;
        
        // Start with the first rule as the base
        if (sortedRules.length > 0) {
          const firstRule = sortedRules[0];
          const firstRuleCount = itemsByCategory[firstRule.category_id] || 0;
          groupSatisfied = firstRuleCount >= firstRule.minimum_items;
          
          console.log(`First rule (${firstRule.category_id}): need ${firstRule.minimum_items}, have ${firstRuleCount}, satisfied: ${groupSatisfied}`);
          
          // Process remaining rules with their logical operators
          for (let i = 1; i < sortedRules.length; i++) {
            const rule = sortedRules[i];
            const categoryItemCount = itemsByCategory[rule.category_id] || 0;
            const ruleSatisfied = categoryItemCount >= rule.minimum_items;
            
            console.log(`Rule ${i} (${rule.category_id}): need ${rule.minimum_items}, have ${categoryItemCount}, satisfied: ${ruleSatisfied}, operator: ${rule.logical_operator}`);
            
            if (rule.logical_operator === 'AND') {
              groupSatisfied = groupSatisfied && ruleSatisfied;
            } else if (rule.logical_operator === 'OR') {
              groupSatisfied = groupSatisfied || ruleSatisfied;
            }
            
            console.log(`Group satisfied after rule ${i}: ${groupSatisfied}`);
          }
        }
        
        console.log(`Final group ${groupId} satisfied: ${groupSatisfied}`);
        
        if (groupSatisfied) {
          console.log(`Rule group ${groupId} is satisfied, delivery eligible`);
          return true;
        }
      }

      console.log('No rule groups satisfied, delivery not eligible');
      return false;
    },
    refetchOnWindowFocus: false,
  });

  const { data: deliveryRulesSummary = [] } = useQuery({
    queryKey: ['enhanced-delivery-rules-summary'],
    queryFn: async () => {
      const { data: rules, error } = await supabase
        .from('delivery_rules')
        .select(`
          *,
          category:menu_categories(name, name_ko)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return rules || [];
    },
  });

  return {
    isDeliveryEligible,
    isLoading,
    deliveryRulesSummary,
  };
};
