
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSharedAdminAccess } from '@/hooks/useSharedAdminAccess';

export interface DeliveryRule {
  id?: string;
  vendor_id: string;
  category_id: string;
  minimum_items: number;
  logical_operator: 'OR';
  rule_group_id: string;
  rule_group_name: string;
  is_active: boolean;
}

export interface RuleGroup {
  id: string;
  name: string;
  rules: DeliveryRule[];
  is_active: boolean;
}

export const useEnhancedDeliveryRules = () => {
  const { adminData, currentUserId } = useSharedAdminAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ruleGroups = [], isLoading } = useQuery({
    queryKey: ['enhanced-delivery-rules-admin'],
    queryFn: async () => {
      console.log('[Enhanced Delivery Rules Admin] Fetching delivery rules for admin dashboard...');
      
      // Admin access - fetch ALL delivery rules across all vendors
      const { data, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .order('rule_group_name', { ascending: true });
      
      if (error) {
        console.error('[Enhanced Delivery Rules Admin] Error fetching delivery rules:', error);
        throw error;
      }

      console.log('[Enhanced Delivery Rules Admin] Raw delivery rules fetched:', data?.length || 0, data);

      // Group rules by rule_group_id to maintain rule groups as single entities
      const groupedRules = (data as DeliveryRule[]).reduce((acc, rule) => {
        const groupId = rule.rule_group_id;
        if (!acc[groupId]) {
          acc[groupId] = {
            id: groupId,
            name: rule.rule_group_name,
            rules: [],
            is_active: rule.is_active,
          };
        }
        acc[groupId].rules.push(rule);
        return acc;
      }, {} as Record<string, RuleGroup>);

      const result = Object.values(groupedRules);
      console.log('[Enhanced Delivery Rules Admin] Grouped rule groups:', result.length, result);
      return result;
    },
    enabled: !!adminData,
  });

  const saveRuleGroup = useMutation({
    mutationFn: async (ruleGroup: RuleGroup) => {
      if (!adminData) throw new Error('Admin access required');
      
      console.log('[Enhanced Delivery Rules Admin] Saving rule group:', ruleGroup);
      
      // Generate a single rule_group_id for the entire group
      const actualGroupId = ruleGroup.id.startsWith('temp-') ? crypto.randomUUID() : ruleGroup.id;
      
      // If this rule group is being set as active, deactivate all other rule groups first
      if (ruleGroup.is_active) {
        console.log('[Enhanced Delivery Rules Admin] Deactivating all other rule groups...');
        await supabase
          .from('delivery_rules')
          .update({ is_active: false })
          .neq('rule_group_id', actualGroupId);
        
        console.log('[Enhanced Delivery Rules Admin] Deactivated all other rule groups before saving new active group');
      }
      
      // Delete existing rules for this group if it's an existing group
      if (!ruleGroup.id.startsWith('temp-')) {
        console.log('[Enhanced Delivery Rules Admin] Deleting existing rules for group:', ruleGroup.id);
        await supabase
          .from('delivery_rules')
          .delete()
          .eq('rule_group_id', ruleGroup.id);
      }

      // Insert new rules - use the current admin's vendor_id as the creator
      // All rules in a group are OR rules now
      const rulesToInsert = ruleGroup.rules.map(rule => ({
        vendor_id: adminData.id, // Track which admin created this rule
        category_id: rule.category_id,
        minimum_items: rule.minimum_items,
        logical_operator: 'OR', // Always OR now
        rule_group_id: actualGroupId, // Use the same ID for all rules in this group
        rule_group_name: ruleGroup.name,
        is_active: ruleGroup.is_active,
      }));

      console.log('[Enhanced Delivery Rules Admin] Inserting rules:', rulesToInsert);

      const { error } = await supabase
        .from('delivery_rules')
        .insert(rulesToInsert);
      
      if (error) {
        console.error('[Enhanced Delivery Rules Admin] Error inserting rules:', error);
        throw error;
      }
      
      console.log('[Enhanced Delivery Rules Admin] Successfully saved rule group');
      return { ...ruleGroup, id: actualGroupId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
      // Also invalidate the customer-facing delivery eligibility queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-summary'] });
      
      toast({
        title: "Success",
        description: "Rule group saved successfully (shared across all admins)",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save rule group",
        variant: "destructive",
      });
    },
  });

  const deleteRuleGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!adminData) throw new Error('Admin access required');
      
      console.log('[Enhanced Delivery Rules Admin] Deleting rule group:', groupId);
      
      const { error } = await supabase
        .from('delivery_rules')
        .delete()
        .eq('rule_group_id', groupId);
      
      if (error) {
        console.error('[Enhanced Delivery Rules Admin] Error deleting rule group:', error);
        throw error;
      }
      
      console.log('[Enhanced Delivery Rules Admin] Successfully deleted rule group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
      // Also invalidate the customer-facing delivery eligibility queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-summary'] });
      
      toast({
        title: "Success",
        description: "Rule group deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule group",
        variant: "destructive",
      });
    },
  });

  const toggleRuleGroup = useMutation({
    mutationFn: async ({ groupId, active }: { groupId: string; active: boolean }) => {
      if (!adminData) throw new Error('Admin access required');
      
      console.log('[Enhanced Delivery Rules Admin] Toggling rule group:', groupId, 'to active:', active);
      
      if (active) {
        // First, deactivate all other rule groups
        console.log('[Enhanced Delivery Rules Admin] Deactivating all other rule groups...');
        await supabase
          .from('delivery_rules')
          .update({ is_active: false })
          .neq('rule_group_id', groupId);
        
        console.log('[Enhanced Delivery Rules Admin] Deactivated all other rule groups before activating new one');
      }
      
      // Then activate/deactivate the selected group
      const { error } = await supabase
        .from('delivery_rules')
        .update({ is_active: active })
        .eq('rule_group_id', groupId);
      
      if (error) {
        console.error('[Enhanced Delivery Rules Admin] Error toggling rule group:', error);
        throw error;
      }
      
      console.log('[Enhanced Delivery Rules Admin] Successfully toggled rule group');
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
      // Also invalidate the customer-facing delivery eligibility queries
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-summary'] });
      
      toast({
        title: "Success",
        description: active 
          ? "Rule group activated successfully (others deactivated)" 
          : "Rule group deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update rule group status",
        variant: "destructive",
      });
    },
  });

  return {
    ruleGroups,
    isLoading,
    saveRuleGroup,
    deleteRuleGroup,
    toggleRuleGroup,
  };
};
