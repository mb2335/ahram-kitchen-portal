
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSharedAdminAccess } from '@/hooks/useSharedAdminAccess';

export interface DeliveryRule {
  id?: string;
  vendor_id: string;
  category_id: string;
  minimum_items: number;
  logical_operator: 'AND' | 'OR';
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
      // Admin access - fetch ALL delivery rules across all vendors
      const { data, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .order('rule_group_name', { ascending: true });
      
      if (error) throw error;

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

      return Object.values(groupedRules);
    },
    enabled: !!adminData,
  });

  const saveRuleGroup = useMutation({
    mutationFn: async (ruleGroup: RuleGroup) => {
      if (!adminData) throw new Error('Admin access required');
      
      // Generate a single rule_group_id for the entire group
      const actualGroupId = ruleGroup.id.startsWith('temp-') ? crypto.randomUUID() : ruleGroup.id;
      
      // Delete existing rules for this group if it's an existing group
      if (!ruleGroup.id.startsWith('temp-')) {
        await supabase
          .from('delivery_rules')
          .delete()
          .eq('rule_group_id', ruleGroup.id);
      }

      // Insert new rules - use the current admin's vendor_id as the creator
      const rulesToInsert = ruleGroup.rules.map(rule => ({
        vendor_id: adminData.id, // Track which admin created this rule
        category_id: rule.category_id,
        minimum_items: rule.minimum_items,
        logical_operator: rule.logical_operator,
        rule_group_id: actualGroupId, // Use the same ID for all rules in this group
        rule_group_name: ruleGroup.name,
        is_active: ruleGroup.is_active,
      }));

      const { error } = await supabase
        .from('delivery_rules')
        .insert(rulesToInsert);
      
      if (error) throw error;
      return { ...ruleGroup, id: actualGroupId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
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
      
      const { error } = await supabase
        .from('delivery_rules')
        .delete()
        .eq('rule_group_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
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
      
      if (active) {
        // First, deactivate all other rule groups
        await supabase
          .from('delivery_rules')
          .update({ is_active: false })
          .neq('rule_group_id', groupId);
        
        console.log('Deactivated all other rule groups before activating new one');
      }
      
      // Then activate/deactivate the selected group
      const { error } = await supabase
        .from('delivery_rules')
        .update({ is_active: active })
        .eq('rule_group_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules-admin'] });
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
