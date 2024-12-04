import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/components/vendor/types';
import { useSession } from '@supabase/auth-helpers-react';

export const useOrders = () => {
  const session = useSession();

  return useQuery({
    queryKey: ['orders', session?.user?.id],
    queryFn: async () => {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (!customerData) return [];

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            menu_item:menu_items (
              name,
              name_ko
            )
          )
        `)
        .eq('customer_id', customerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders;
    },
    enabled: !!session?.user?.id,
    refetchInterval: 5000,
  });
};

export const useVendorOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders, refetch } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone),
          order_items(id, menu_item_id, quantity, unit_price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    refetchInterval: 5000,
  });

  const updateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    orders,
    updateOrderStatus,
    refetch,
  };
};