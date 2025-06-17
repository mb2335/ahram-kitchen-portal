
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVendorId } from '@/hooks/useVendorId';

export interface DeliveryRule {
  id: string;
  vendor_id: string;
  category_id: string;
  minimum_items: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDeliveryRules = () => {
  const { vendorId } = useVendorId();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveryRules = [], isLoading } = useQuery({
    queryKey: ['delivery-rules', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('delivery_rules')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DeliveryRule[];
    },
    enabled: !!vendorId,
  });

  const upsertDeliveryRule = useMutation({
    mutationFn: async (rule: Partial<DeliveryRule>) => {
      if (!vendorId) throw new Error('Vendor ID required');
      
      const { data, error } = await supabase
        .from('delivery_rules')
        .upsert({
          vendor_id: vendorId,
          category_id: rule.category_id,
          minimum_items: rule.minimum_items,
          is_active: rule.is_active ?? true,
        }, {
          onConflict: 'vendor_id,category_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-rules'] });
      toast({
        title: "Success",
        description: "Delivery rule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery rule",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('delivery_rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-rules'] });
      toast({
        title: "Success",
        description: "Delivery rule deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete delivery rule",
        variant: "destructive",
      });
    },
  });

  return {
    deliveryRules,
    isLoading,
    upsertDeliveryRule,
    deleteDeliveryRule,
  };
};
