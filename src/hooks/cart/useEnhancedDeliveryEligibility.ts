
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

interface DeliveryRule {
  id: string;
  category_id: string;
  minimum_items: number;
  rule_group_id: string;
  rule_group_name: string;
  is_active: boolean;
  vendor_id: string;
  logical_operator: string;
}

export const useEnhancedDeliveryEligibility = () => {
  const { items } = useCart();

  const { data: isDeliveryEligible = false, isLoading } = useQuery({
    queryKey: ['enhanced-delivery-eligibility', items],
    queryFn: async () => {
      if (items.length === 0) {
        return false;
      }

      // Get only active delivery rules
      const { data: deliveryRules, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching active delivery rules:', error);
        return false;
      }

      if (!deliveryRules || deliveryRules.length === 0) {
        // If no active rules are configured, delivery is available for everyone
        return true;
      }

      // Count items by category for ALL customers (guest and authenticated)
      const itemsByCategory = items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        acc[categoryId] = (acc[categoryId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      // Group rules by rule_group_id - only process active rules
      const ruleGroups = (deliveryRules as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(rule);
        return acc;
      }, {} as Record<string, DeliveryRule[]>);

      // Check if any rule group is satisfied - same logic for all customers
      let anyGroupSatisfied = false;
      
      for (const [groupId, groupRules] of Object.entries(ruleGroups)) {
        if (groupRules.length === 0) continue;
        
        // Sort rules to ensure consistent evaluation order
        const sortedRules = [...groupRules].sort((a, b) => a.id.localeCompare(b.id));
        
        // Evaluate each rule individually
        const ruleResults = sortedRules.map(rule => {
          const categoryItemCount = itemsByCategory[rule.category_id] || 0;
          const satisfied = categoryItemCount >= rule.minimum_items;
          return satisfied;
        });

        // OR evaluation: AT LEAST ONE condition must be true within this group
        const groupSatisfied = ruleResults.some(result => result === true);
        
        if (groupSatisfied) {
          anyGroupSatisfied = true;
          break; // Exit early if any group is satisfied
        }
      }

      return anyGroupSatisfied;
    },
    refetchOnWindowFocus: false,
  });

  const { data: deliveryRulesSummary = [] } = useQuery({
    queryKey: ['enhanced-delivery-rules-summary'],
    queryFn: async () => {
      // Fetch delivery rules summary for ALL customers to show requirements - only active rules
      const { data: rules, error } = await supabase
        .from('delivery_rules')
        .select(`
          *,
          category:menu_categories(name, name_ko)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching delivery rules summary:', error);
        throw error;
      }
      
      return rules || [];
    },
  });

  return {
    isDeliveryEligible,
    isLoading,
    deliveryRulesSummary,
  };
};
