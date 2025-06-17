
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { OrderStatus } from './types';
import { SimpleOrderCard } from '@/components/order/SimpleOrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useOrders';
import { OrderFilters } from './order/OrderFilters';
import type { OrderFilters as OrderFiltersType } from './order/OrderFilters';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { SendSMSDialog } from './order/SendSMSDialog';
import { OrderActions } from './order/OrderActions';
import { SendSMSToCustomer } from './order/SendSMSToCustomer';

export function OrderManagement() {
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const { toast } = useToast();
  const { orders, updateOrderStatus, deleteOrder, refetch } = useVendorOrders();

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
      await refetch();
    } else {
      toast({
        title: 'Error updating order status',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleOrderDelete = async (orderId: string) => {
    try {
      const result = await deleteOrder(orderId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: 'Order deleted successfully',
      });
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Error deleting order',
        description: error.message || 'Failed to delete the order',
        variant: 'destructive',
      });
    }
  };

  // Helper function to normalize dates for comparison
  const normalizeDateForComparison = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getFilteredOrders = (status: string) => {
    return orders?.filter(order => {
      // Status filtering
      if (order.status !== status) {
        return false;
      }

      // DATE FILTERING
      if (filters.date) {
        const orderDate = new Date(order.delivery_date);
        const filterDate = new Date(filters.date);
        
        const normalizedOrderDate = normalizeDateForComparison(orderDate);
        const normalizedFilterDate = normalizeDateForComparison(filterDate);
        
        if (normalizedOrderDate !== normalizedFilterDate) {
          return false;
        }
      }

      // Customer Name filtering
      if (filters.customerName && filters.customerName.trim() !== '') {
        const customerName = order.customer?.full_name || order.customer_name || '';
        if (!customerName.toLowerCase().includes(filters.customerName.toLowerCase())) {
          return false;
        }
      }

      // Fulfillment type filtering
      if (filters.fulfillmentType && filters.fulfillmentType !== 'all') {
        if (order.fulfillment_type !== filters.fulfillmentType) {
          return false;
        }
      }

      // Pickup location filtering
      if (filters.pickupLocation && filters.pickupLocation !== 'all') {
        if (order.fulfillment_type !== FULFILLMENT_TYPE_PICKUP) {
          return false;
        }
        if (order.pickup_location !== filters.pickupLocation) {
          return false;
        }
      }

      return true;
    }) || [];
  };

  // Extract unique pickup locations from orders
  const pickupLocations = Array.from(new Set(
    orders?.map(order => order.pickup_location).filter(Boolean) || []
  ));

  const renderOrdersList = (status: string) => {
    const filteredOrders = getFilteredOrders(status);
    
    if (filteredOrders.length === 0) {
      return <p className="text-center text-gray-500">No orders found</p>;
    }

    return filteredOrders.map((order) => (
      <SimpleOrderCard 
        key={order.id} 
        order={order}
        showCustomerInfo={true}
        actions={
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <OrderStatusActions
                status={order.status as OrderStatus}
                onUpdateStatus={(status, reason) => {
                  handleStatusUpdate(order.id, status, reason);
                }}
                rejectionReason={rejectionReason}
                setRejectionReason={setRejectionReason}
              />
              {(order.customer?.phone || order.customer_phone) && (
                <SendSMSToCustomer 
                  customerPhone={order.customer?.phone || order.customer_phone || ''} 
                  customerName={order.customer?.full_name || order.customer_name || "Customer"}
                />
              )}
            </div>
            <OrderActions 
              orderId={order.id}
              onDelete={handleOrderDelete}
            />
          </div>
        }
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <SendSMSDialog 
          orders={orders || []}
          pickupLocations={pickupLocations}
        />
      </div>
      
      <OrderFilters 
        onFilterChange={setFilters}
        pickupLocations={pickupLocations}
      />

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
            {renderOrdersList('pending')}
          </div>
        </TabsContent>
        <TabsContent value="confirmed" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList('confirmed')}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList('completed')}
          </div>
        </TabsContent>
        <TabsContent value="rejected" className="mt-6">
          <div className="grid gap-4">
            {renderOrdersList('rejected')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
