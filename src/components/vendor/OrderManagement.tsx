import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { OrderCard } from './OrderCard';
import { OrderStatusActions } from './OrderStatusActions';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('Fetching all orders...');
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone),
          order_items(id, menu_item_id, quantity, unit_price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched orders:', data);
      setOrders(data as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error fetching orders',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], reason?: string) => {
    try {
      console.log(`Updating order ${orderId} to status: ${status}`);
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order ${status} successfully`,
      });

      fetchOrders();
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error updating order status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order}>
            <OrderStatusActions
              status={order.status}
              onUpdateStatus={(status, reason) => updateOrderStatus(order.id, status, reason)}
              rejectionReason={rejectionReason}
              setRejectionReason={setRejectionReason}
            />
          </OrderCard>
        ))}
      </div>
    </div>
  );
}