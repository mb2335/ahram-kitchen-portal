import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { OrderCard } from './OrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      // Update local state to reflect the change immediately
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              status,
              rejection_reason: reason || order.rejection_reason
            };
          }
          return order;
        })
      );

      toast({
        title: 'Success',
        description: status === 'rejected' 
          ? `Order rejected${reason ? ': ' + reason : ''}`
          : `Order ${status} successfully`,
      });

    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error updating order status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getFilteredOrders = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const renderOrdersList = (filteredOrders: Order[]) => {
    if (filteredOrders.length === 0) {
      return <p className="text-center text-gray-500">No orders found</p>;
    }

    return filteredOrders.map((order) => (
      <OrderCard key={order.id} order={order}>
        <OrderStatusActions
          status={order.status}
          onUpdateStatus={(status, reason) => updateOrderStatus(order.id, status, reason)}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
        />
      </OrderCard>
    ));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders</h2>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({getFilteredOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({getFilteredOrders('confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getFilteredOrders('completed').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({getFilteredOrders('rejected').length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList(getFilteredOrders('pending'))}
          </div>
        </TabsContent>
        <TabsContent value="confirmed" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList(getFilteredOrders('confirmed'))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList(getFilteredOrders('completed'))}
          </div>
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList(getFilteredOrders('rejected'))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}