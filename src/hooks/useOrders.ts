import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/components/vendor/types';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

// Shared query keys for better cache management
export const orderKeys = {
  all: ['orders'] as const,
  customer: (customerId: string) => [...orderKeys.all, 'customer', customerId] as const,
  vendor: ['vendor-orders'] as const,
};

export const useOrders = () => {
  const session = useSession();
  const { toast } = useToast();

  return useQuery({
    queryKey: session?.user?.id ? orderKeys.all : null,
    queryFn: async () => {
      try {
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
      } catch (error: any) {
        toast({
          title: 'Error fetching orders',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!session?.user?.id,
    refetchInterval: 5000,
    staleTime: 0, // Consider all data stale immediately
  });
};

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, refetch } = useQuery({
    queryKey: orderKeys.vendor,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(full_name, email, phone),
            order_items(
              id, 
              menu_item_id, 
              quantity, 
              unit_price,
              menu_item:menu_items(
                name,
                name_ko
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Order[];
      } catch (error: any) {
        toast({
          title: 'Error fetching vendor orders',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }
    },
    refetchInterval: 5000,
    staleTime: 0, // Consider all data stale immediately
  });

  const updateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      console.log('Updating order status:', { orderId, status, reason });
      
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Invalidate both customer and vendor queries
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: orderKeys.vendor });
      
      // Force an immediate refetch
      await refetch();
      
      console.log('Order status updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: orderKeys.vendor });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting order:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    orders,
    updateOrderStatus,
    deleteOrder,
    refetch,
  };
};