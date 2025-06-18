
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
        
        if (groupRules.length === 0) continue;
        
        // Sort rules to ensure consistent evaluation order
        const sortedRules = [...groupRules].sort((a, b) => a.id.localeCompare(b.id));
        
        // Evaluate each rule individually first
        const ruleResults = sortedRules.map(rule => {
          const categoryItemCount = itemsByCategory[rule.category_id] || 0;
          const satisfied = categoryItemCount >= rule.minimum_items;
          console.log(`Rule evaluation - Category: ${rule.category_id}, Need: ${rule.minimum_items}, Have: ${categoryItemCount}, Satisfied: ${satisfied}`);
          return satisfied;
        });

        console.log(`Rule results for group ${groupId}:`, ruleResults);

        // Now evaluate the logical expression correctly
        let groupSatisfied: boolean;
        
        if (sortedRules.length === 1) {
          // Single rule case
          groupSatisfied = ruleResults[0];
          console.log(`Single rule evaluation: ${groupSatisfied}`);
        } else {
          // Multiple rules case - build logical expression from left to right
          // The logical_operator on rule[i] determines how rule[i] combines with the previous result
          groupSatisfied = ruleResults[0]; // Start with first rule result
          console.log(`Starting with first rule result: ${groupSatisfied}`);
          
          for (let i = 1; i < sortedRules.length; i++) {
            const rule = sortedRules[i];
            const currentRuleResult = ruleResults[i];
            const operator = rule.logical_operator;
            
            console.log(`Combining with rule ${i}: previous=${groupSatisfied}, current=${currentRuleResult}, operator=${operator}`);
            
            if (operator === 'AND') {
              groupSatisfied = groupSatisfied && currentRuleResult;
              console.log(`After AND: ${groupSatisfied} (${groupSatisfied ? 'both' : 'at least one'} conditions ${groupSatisfied ? 'satisfied' : 'not satisfied'})`);
            } else if (operator === 'OR') {
              groupSatisfied = groupSatisfied || currentRuleResult;
              console.log(`After OR: ${groupSatisfied} (${groupSatisfied ? 'at least one' : 'neither'} condition satisfied)`);
            }
          }
        }
        
        console.log(`Final evaluation for group ${groupId}: ${groupSatisfied}`);
        
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
