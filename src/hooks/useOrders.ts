
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
        // For authenticated users, get orders by user_id
        if (session?.user?.id) {
          // First, check if the user has a customer record
          const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          // Fetch orders based on either the customer_id (if it exists)
          // or by matching email in the orders table
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

  const { data: orders, refetch } = useQuery({
    queryKey: orderKeys.vendor,
    queryFn: async () => {
      try {
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
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteOrder = async (orderId: string) => {
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
        queryClient.invalidateQueries({ queryKey: orderKeys.vendor }),
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
