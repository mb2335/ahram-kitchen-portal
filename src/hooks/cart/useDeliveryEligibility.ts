
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';

export const useDeliveryEligibility = () => {
  const { items } = useCart();

  const { data: isDeliveryEligible = false, isLoading } = useQuery({
    queryKey: ['delivery-eligibility', items],
    queryFn: async () => {
      if (items.length === 0) return false;

      // Get all delivery rules
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

      // Check if any category meets its minimum requirement
      for (const rule of deliveryRules) {
        const categoryItemCount = itemsByCategory[rule.category_id] || 0;
        if (categoryItemCount >= rule.minimum_items) {
          return true;
        }
      }

      return false;
    },
    refetchOnWindowFocus: false,
  });

  const { data: deliveryRulesSummary = [] } = useQuery({
    queryKey: ['delivery-rules-summary'],
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
