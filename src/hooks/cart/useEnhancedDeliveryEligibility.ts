
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

      // Group rules by rule_group_id
      const ruleGroups = (deliveryRules as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(rule);
        return acc;
      }, {} as Record<string, DeliveryRule[]>);

      // Check if any rule group is satisfied
      for (const groupRules of Object.values(ruleGroups)) {
        let groupSatisfied = false;
        
        // Determine if this group uses AND or OR logic
        const hasAndRules = groupRules.some(rule => rule.logical_operator === 'AND');
        const hasOrRules = groupRules.some(rule => rule.logical_operator === 'OR');
        
        if (hasAndRules && !hasOrRules) {
          // All rules must be satisfied (AND logic)
          groupSatisfied = groupRules.every(rule => {
            const categoryItemCount = itemsByCategory[rule.category_id] || 0;
            return categoryItemCount >= rule.minimum_items;
          });
        } else if (hasOrRules && !hasAndRules) {
          // Any rule can be satisfied (OR logic)
          groupSatisfied = groupRules.some(rule => {
            const categoryItemCount = itemsByCategory[rule.category_id] || 0;
            return categoryItemCount >= rule.minimum_items;
          });
        } else {
          // Mixed logic - evaluate in sequence
          let result = true;
          for (let i = 0; i < groupRules.length; i++) {
            const rule = groupRules[i];
            const categoryItemCount = itemsByCategory[rule.category_id] || 0;
            const ruleSatisfied = categoryItemCount >= rule.minimum_items;
            
            if (i === 0) {
              result = ruleSatisfied;
            } else if (rule.logical_operator === 'AND') {
              result = result && ruleSatisfied;
            } else if (rule.logical_operator === 'OR') {
              result = result || ruleSatisfied;
            }
          }
          groupSatisfied = result;
        }
        
        if (groupSatisfied) {
          return true;
        }
      }

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
