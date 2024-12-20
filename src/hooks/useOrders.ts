import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/components/vendor/types';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

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
            customer:customers (
              id,
              full_name,
              email,
              phone
            ),
            order_items (
              id,
              quantity,
              unit_price,
              menu_item:menu_items (
                id,
                name,
                name_ko,
                price
              )
            )
          `)
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('Customer orders fetched:', orders);
        return orders as Order[];
      } catch (error: any) {
        console.error('Error fetching orders:', error);
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
    staleTime: 0,
  });
};

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, refetch } = useQuery({
    queryKey: orderKeys.vendor,
    queryFn: async () => {
      try {
        console.log('Fetching vendor orders...');
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(
              id,
              full_name,
              email,
              phone
            ),
            order_items(
              id,
              menu_item_id,
              quantity,
              unit_price,
              menu_item:menu_items(
                id,
                name,
                name_ko,
                price,
                description,
                description_ko,
                category
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching vendor orders:', error);
          throw error;
        }

        console.log('Vendor orders fetched successfully:', data);
        return data as Order[];
      } catch (error: any) {
        console.error('Error in useVendorOrders:', error);
        toast({
          title: 'Error fetching vendor orders',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }
    },
    refetchInterval: 5000,
    staleTime: 0,
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

      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: orderKeys.vendor });
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
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

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