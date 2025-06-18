
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
      console.log('[Enhanced Delivery Eligibility] Starting check with items:', items.length);
      
      if (items.length === 0) {
        console.log('[Enhanced Delivery Eligibility] No items in cart, delivery not eligible');
        return false;
      }

      // Fetch ALL delivery rules from the database first (debug step)
      console.log('[Enhanced Delivery Eligibility] Fetching all delivery rules for debugging...');
      const { data: allRules, error: allRulesError } = await supabase
        .from('delivery_rules')
        .select('*');

      if (allRulesError) {
        console.error('[Enhanced Delivery Eligibility] Error fetching all delivery rules:', allRulesError);
      } else {
        console.log('[Enhanced Delivery Eligibility] ALL delivery rules in database:', allRules?.length || 0, allRules);
      }

      // Get only active delivery rules
      const { data: deliveryRules, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('[Enhanced Delivery Eligibility] Error fetching active delivery rules:', error);
        return false;
      }

      console.log('[Enhanced Delivery Eligibility] Found ACTIVE delivery rules:', deliveryRules?.length || 0, deliveryRules);

      if (!deliveryRules || deliveryRules.length === 0) {
        // If no active rules are configured, delivery is available for everyone
        console.log('[Enhanced Delivery Eligibility] No ACTIVE delivery rules configured - delivery available for all customers');
        return true;
      }

      // Count items by category for ALL customers (guest and authenticated)
      const itemsByCategory = items.reduce((acc, item) => {
        const categoryId = item.category_id || 'uncategorized';
        acc[categoryId] = (acc[categoryId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      console.log('[Enhanced Delivery Eligibility] Items by category (applies to all customers):', itemsByCategory);

      // Group rules by rule_group_id - only process active rules
      const ruleGroups = (deliveryRules as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(rule);
        return acc;
      }, {} as Record<string, DeliveryRule[]>);

      console.log('[Enhanced Delivery Eligibility] Active rule groups (apply to all customers):', Object.keys(ruleGroups).length, ruleGroups);

      // Check if any rule group is satisfied - same logic for all customers
      let anyGroupSatisfied = false;
      
      for (const [groupId, groupRules] of Object.entries(ruleGroups)) {
        console.log(`[Enhanced Delivery Eligibility] Evaluating rule group ${groupId} for current customer:`, groupRules.length, 'rules');
        
        if (groupRules.length === 0) continue;
        
        // Sort rules to ensure consistent evaluation order
        const sortedRules = [...groupRules].sort((a, b) => a.id.localeCompare(b.id));
        
        // Evaluate each rule individually
        const ruleResults = sortedRules.map(rule => {
          const categoryItemCount = itemsByCategory[rule.category_id] || 0;
          const satisfied = categoryItemCount >= rule.minimum_items;
          console.log(`[Enhanced Delivery Eligibility] Rule evaluation - Category: ${rule.category_id}, Need: ${rule.minimum_items}, Have: ${categoryItemCount}, Satisfied: ${satisfied}`);
          return satisfied;
        });

        console.log(`[Enhanced Delivery Eligibility] Rule results for group ${groupId}:`, ruleResults);

        // OR evaluation: AT LEAST ONE condition must be true within this group
        const groupSatisfied = ruleResults.some(result => result === true);
        console.log(`[Enhanced Delivery Eligibility] OR group evaluation for ${groupId}: ${groupSatisfied} (at least one condition must be true: [${ruleResults.join(', ')}])`);
        
        if (groupSatisfied) {
          console.log(`[Enhanced Delivery Eligibility] Rule group ${groupId} is satisfied, delivery eligible for current customer`);
          anyGroupSatisfied = true;
          break; // Exit early if any group is satisfied
        }
      }

      console.log(`[Enhanced Delivery Eligibility] Final result: ${anyGroupSatisfied ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      return anyGroupSatisfied;
    },
    refetchOnWindowFocus: false,
  });

  const { data: deliveryRulesSummary = [] } = useQuery({
    queryKey: ['enhanced-delivery-rules-summary'],
    queryFn: async () => {
      console.log('[Enhanced Delivery Eligibility] Fetching delivery rules summary...');
      
      // Fetch delivery rules summary for ALL customers to show requirements - only active rules
      const { data: rules, error } = await supabase
        .from('delivery_rules')
        .select(`
          *,
          category:menu_categories(name, name_ko)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('[Enhanced Delivery Eligibility] Error fetching delivery rules summary:', error);
        throw error;
      }
      
      console.log('[Enhanced Delivery Eligibility] Delivery rules summary (available to all customers):', rules?.length || 0, rules);
      return rules || [];
    },
  });

  return {
    isDeliveryEligible,
    isLoading,
    deliveryRulesSummary,
  };
};
