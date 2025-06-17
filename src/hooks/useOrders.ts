
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@supabase/auth-helpers-react';

export function useOrders() {
  const session = useSession();

  return useQuery({
    queryKey: ['orders', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching customer orders with detailed category information...');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer orders:', error);
        throw error;
      }

      console.log('Raw customer orders data:', data);
      
      // Debug: Log category information for each item
      data?.forEach(order => {
        console.log(`Customer Order ${order.id}:`, order.order_items?.map(item => ({
          name: item.menu_item?.name,
          category: item.menu_item?.category?.name,
          categoryId: item.menu_item?.category?.id
        })));
      });

      return data;
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60, // 1 minute
  });
}
