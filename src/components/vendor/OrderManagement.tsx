import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function OrderManagement() {
  const session = useSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorData) {
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(full_name, email, phone),
            order_items(
              quantity,
              unit_price,
              menu_item:menu_items(name)
            )
          `)
          .order('created_at', { ascending: false });
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: 'processing' | 'completed' | 'rejected') {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order status updated to ${status}`,
      });

      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>
      <div className="grid gap-4">
        {orders.map((order: any) => (
          <div
            key={order.id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {order.customer?.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {order.status}
                </p>
                <div className="mt-2">
                  {order.order_items.map((item: any) => (
                    <p key={item.id} className="text-sm">
                      {item.quantity}x {item.menu_item?.name} - ${item.unit_price}
                    </p>
                  ))}
                </div>
                <p className="mt-2 font-semibold">
                  Total: ${order.total_amount}
                </p>
              </div>
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {order.status === 'processing' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}