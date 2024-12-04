import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorError) throw vendorError;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone),
          order_items(id, menu_item_id, quantity, unit_price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as Order[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching orders',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error updating order status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Orders</h2>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Order ID</th>
            <th className="border border-gray-300 px-4 py-2">Customer</th>
            <th className="border border-gray-300 px-4 py-2">Total</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <th className="border border-gray-300 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="border border-gray-300 px-4 py-2">{order.id}</td>
              <td className="border border-gray-300 px-4 py-2">{order.customer?.full_name}</td>
              <td className="border border-gray-300 px-4 py-2">${order.total_amount.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-2">{order.status}</td>
              <td className="border border-gray-300 px-4 py-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                >
                  Mark as Complete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
