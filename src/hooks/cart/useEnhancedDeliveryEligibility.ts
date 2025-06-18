
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
}

export const useEnhancedDeliveryEligibility = () => {
  const { items } = useCart();

  const { data: isDeliveryEligible = false, isLoading } = useQuery({
    queryKey: ['enhanced-delivery-eligibility', items],
    queryFn: async () => {
      // No authentication required - delivery rules apply to ALL customers
      if (items.length === 0) return false;

      // Get all active delivery rules - no user restrictions
      const { data: deliveryRules, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching delivery rules:', error);
        return false;
      }

      if (!deliveryRules || deliveryRules.length === 0) {
        // If no rules are configured, delivery is available for everyone
        console.log('No delivery rules configured - delivery available for all customers');
        return true;
      }

      // Count items by category for ALL customers (guest and authenticated)
      const itemsByCategory = items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        acc[categoryId] = (acc[categoryId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      console.log('Items by category (applies to all customers):', itemsByCategory);

      // Group rules by rule_group_id
      const ruleGroups = (deliveryRules as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(rule);
        return acc;
      }, {} as Record<string, DeliveryRule[]>);

      console.log('Rule groups (apply to all customers):', ruleGroups);

      // Check if any rule group is satisfied - same logic for all customers
      for (const [groupId, groupRules] of Object.entries(ruleGroups)) {
        console.log(`Evaluating rule group ${groupId} for current customer:`, groupRules);
        
        if (groupRules.length === 0) continue;
        
        // Sort rules to ensure consistent evaluation order
        const sortedRules = [...groupRules].sort((a, b) => a.id.localeCompare(b.id));
        
        // Evaluate each rule individually
        const ruleResults = sortedRules.map(rule => {
          const categoryItemCount = itemsByCategory[rule.category_id] || 0;
          const satisfied = categoryItemCount >= rule.minimum_items;
          console.log(`Rule evaluation - Category: ${rule.category_id}, Need: ${rule.minimum_items}, Have: ${categoryItemCount}, Satisfied: ${satisfied}`);
          return satisfied;
        });

        console.log(`Rule results for group ${groupId}:`, ruleResults);

        // OR evaluation: AT LEAST ONE condition must be true
        const groupSatisfied = ruleResults.some(result => result === true);
        console.log(`OR group evaluation: ${groupSatisfied} (at least one condition must be true: [${ruleResults.join(', ')}])`);
        
        console.log(`Final evaluation for group ${groupId}: ${groupSatisfied}`);
        
        if (groupSatisfied) {
          console.log(`Rule group ${groupId} is satisfied, delivery eligible for current customer`);
          return true;
        }
      }

      console.log('No rule groups satisfied, delivery not eligible for current customer');
      return false;
    },
    refetchOnWindowFocus: false,
  });

  const { data: deliveryRulesSummary = [] } = useQuery({
    queryKey: ['enhanced-delivery-rules-summary'],
    queryFn: async () => {
      // Fetch delivery rules summary for ALL customers to show requirements
      const { data: rules, error } = await supabase
        .from('delivery_rules')
        .select(`
          *,
          category:menu_categories(name, name_ko)
        `)
        .eq('is_active', true);

      if (error) throw error;
      console.log('Delivery rules summary (available to all customers):', rules);
      return rules || [];
    },
  });

  return {
    isDeliveryEligible,
    isLoading,
    deliveryRulesSummary,
  };
};
