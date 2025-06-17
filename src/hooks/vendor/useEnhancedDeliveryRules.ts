
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVendorId } from '@/hooks/useVendorId';

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
  const { vendorId } = useVendorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ruleGroups = [], isLoading } = useQuery({
    queryKey: ['enhanced-delivery-rules', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('rule_group_name', { ascending: true });
      
      if (error) throw error;

      // Group rules by rule_group_id
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
    enabled: !!vendorId,
  });

  const saveRuleGroup = useMutation({
    mutationFn: async (ruleGroup: RuleGroup) => {
      if (!vendorId) throw new Error('Vendor ID required');
      
      // Delete existing rules for this group
      if (!ruleGroup.id.startsWith('temp-')) {
        await supabase
          .from('delivery_rules')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('rule_group_id', ruleGroup.id);
      }

      // Insert new rules
      const rulesToInsert = ruleGroup.rules.map(rule => ({
        vendor_id: vendorId,
        category_id: rule.category_id,
        minimum_items: rule.minimum_items,
        logical_operator: rule.logical_operator,
        rule_group_id: ruleGroup.id.startsWith('temp-') ? crypto.randomUUID() : ruleGroup.id,
        rule_group_name: ruleGroup.name,
        is_active: ruleGroup.is_active,
      }));

      const { error } = await supabase
        .from('delivery_rules')
        .insert(rulesToInsert);
      
      if (error) throw error;
      return ruleGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules'] });
      toast({
        title: "Success",
        description: "Rule group saved successfully",
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
      if (!vendorId) throw new Error('Vendor ID required');
      
      const { error } = await supabase
        .from('delivery_rules')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('rule_group_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules'] });
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
      if (!vendorId) throw new Error('Vendor ID required');
      
      const { error } = await supabase
        .from('delivery_rules')
        .update({ is_active: active })
        .eq('vendor_id', vendorId)
        .eq('rule_group_id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-delivery-rules'] });
      toast({
        title: "Success",
        description: "Rule group status updated successfully",
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
