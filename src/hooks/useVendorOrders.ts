
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/components/vendor/types';

export function useVendorOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      console.log('Fetching vendor orders with detailed category information...');
      
      const { data, error } = await supabase
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
            menu_item_id,
            quantity,
            unit_price,
            discount_percentage,
            menu_item:menu_items (
              id,
              name,
              name_ko,
              discount_percentage,
              category:menu_categories (
                id,
                name,
                name_ko
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor orders:', error);
        throw error;
      }

      console.log('Raw vendor orders data:', data);
      
      // Debug: Log category information for each item
      data?.forEach(order => {
        console.log(`Order ${order.id}:`, order.order_items?.map(item => ({
          name: item.menu_item?.name,
          category: item.menu_item?.category?.name,
          categoryId: item.menu_item?.category?.id
        })));
      });

      return data as Order[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status, reason, skipNotification = false }: { 
      orderId: string; 
      status: string; 
      reason?: string;
      skipNotification?: boolean;
    }) => {
      console.log('Updating order status:', { orderId, status, reason, skipNotification });
      
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Send notification only if not skipped
      if (!skipNotification) {
        try {
          await supabase.functions.invoke('send-order-notification', {
            body: { orderId, status, reason }
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      console.log('Starting order deletion process for order:', orderId);
      
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        throw itemsError;
      }

      console.log('Successfully deleted order items');

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw orderError;
      }

      console.log('Successfully deleted order');
      return orderId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
  });

  return {
    orders,
    isLoading,
    error,
    refetch,
    updateOrderStatus: async (orderId: string, status: string, reason?: string, skipNotification = false) => {
      const result = await updateOrderStatus.mutateAsync({ orderId, status, reason, skipNotification });
      return { success: true, data: result };
    },
    deleteOrder: async (orderId: string) => {
      try {
        await deleteOrder.mutateAsync(orderId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }
  };
}
