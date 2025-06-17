
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/components/vendor/types';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { useSharedAdminAccess } from './useSharedAdminAccess';

export const orderKeys = {
  all: ['orders'] as const,
  customer: (customerId: string) => [...orderKeys.all, 'customer', customerId] as const,
  vendor: ['vendor-orders'] as const,
  admin: ['admin-orders'] as const,
};

export const useOrders = () => {
  const session = useSession();
  const { toast } = useToast();

  return useQuery({
    queryKey: session?.user?.id ? orderKeys.all : null,
    queryFn: async () => {
      try {
        // For authenticated users, get orders by user_id
        if (session?.user?.id) {
          // First, check if the user has a customer record
          const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          // Fetch orders with proper category information for each item
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
                menu_item_id,
                quantity,
                unit_price,
                discount_percentage,
                menu_item:menu_items (
                  id,
                  name,
                  name_ko,
                  category:menu_categories (
                    id,
                    name,
                    name_ko
                  )
                )
              )
            `)
            .or(
              customerData 
                ? `customer_id.eq.${customerData.id},customer_email.eq.${session.user.email}` 
                : `customer_email.eq.${session.user.email}`
            )
            .order('created_at', { ascending: false });

          if (error) throw error;
          return orders as unknown as Order[];
        }
        
        return [];
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
    staleTime: 0,
  });
};

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useSharedAdminAccess();

  const { data: orders, refetch } = useQuery({
    queryKey: orderKeys.admin,
    queryFn: async () => {
      try {
        // Admin access - fetch ALL orders across the platform with proper category data
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
              discount_percentage,
              menu_item:menu_items(
                id,
                name,
                name_ko,
                category:menu_categories(
                  id,
                  name,
                  name_ko
                )
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as Order[];
      } catch (error: any) {
        toast({
          title: 'Error fetching admin orders',
          description: error.message,
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: isAdmin,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const updateOrderStatus = async (orderId: string, status: string, reason?: string, skipNotification: boolean = false) => {
    try {
      // Get the current order to compare status for notifications
      const { data: currentOrder } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            menu_item_id,
            menu_item:menu_items (
              id,
              name,
              name_ko
            )
          )
        `)
        .eq('id', orderId)
        .single();
        
      if (!currentOrder) throw new Error('Order not found');
      
      const previousStatus = currentOrder.status;
      
      // Update the order status
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Only send SMS notification if not skipped (to prevent duplicate notifications for unified orders)
      if (!skipNotification) {
        // Get the updated order with customer information for notifications
        const { data: updatedOrder } = await supabase
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
              menu_item_id,
              menu_item:menu_items (
                id,
                name,
                name_ko
              )
            )
          `)
          .eq('id', orderId)
          .single();
          
        // Send SMS notification for status change
        if (updatedOrder) {
          try {
            await supabase.functions.invoke('send-sms', {
              body: {
                type: 'order_status_update',
                order: updatedOrder,
                previousStatus
              }
            });
            console.log('Order status notification sent');
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Continue with the order update even if notification fails
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: orderKeys.admin });
      await refetch();
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string, skipNotification = false) => {
    try {
      console.log('Starting order deletion process for order:', orderId);
      
      // First delete all order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error deleting order items:', itemsError);
        throw itemsError;
      }

      console.log('Successfully deleted order items');

      // Then delete the order itself
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('Error deleting order:', orderError);
        throw orderError;
      }

      console.log('Successfully deleted order');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.admin }),
        refetch()
      ]);

      return { success: true };
    } catch (error: any) {
      console.error('Delete order error:', error);
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
