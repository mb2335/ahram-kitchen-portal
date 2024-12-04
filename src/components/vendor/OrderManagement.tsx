import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { OrderCard } from './OrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useOrders';

export function OrderManagement() {
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const { orders, updateOrderStatus } = useVendorOrders();

  const handleStatusUpdate = async (orderId: string, status: string, reason?: string) => {
    console.log('Handling status update:', { orderId, status, reason });
    
    const result = await updateOrderStatus(orderId, status, reason);
    
    if (result.success) {
      toast({
        title: 'Success',
        description: status === 'rejected' 
          ? `Order rejected${reason ? ': ' + reason : ''}`
          : `Order ${status} successfully`,
      });
    } else {
      toast({
        title: 'Error updating order status',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const getFilteredOrders = (status: string) => {
    console.log('Filtering orders for status:', status, 'Total orders:', orders?.length);
    return orders?.filter(order => order.status === status) || [];
  };

  const renderOrdersList = (filteredOrders: Order[]) => {
    if (filteredOrders.length === 0) {
      return <p className="text-center text-gray-500">No orders found</p>;
    }

    return filteredOrders.map((order) => (
      <OrderCard key={order.id} order={order}>
        <OrderStatusActions
          status={order.status}
          onUpdateStatus={(status, reason) => handleStatusUpdate(order.id, status, reason)}
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