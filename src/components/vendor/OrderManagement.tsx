import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { OrderCard } from './OrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useOrders';
import { OrderFilters } from './order/OrderFilters';
import type { OrderFilters as OrderFiltersType } from './order/OrderFilters';

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

  const handleDelete = async (orderId: string) => {
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order deleted successfully',
        });
        // Immediately refetch orders after successful deletion
        await refetch();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting order',
        description: error.message || 'Failed to delete the order',
        variant: 'destructive',
      });
    }
  };

  const filterOrders = (orders: Order[]) => {
    return orders?.filter(order => {
      const selectedDate = filters.date ? new Date(filters.date) : null;
      const orderDate = new Date(order.delivery_date);

      // Date filter
      if (selectedDate) {
        const orderDateString = orderDate.toDateString();
        const selectedDateString = selectedDate.toDateString();
        if (orderDateString !== selectedDateString) return false;
      }

      // Category filter
      if (filters.categoryId) {
        const hasCategory = order.order_items?.some(item => 
          item.menu_item?.category?.id === filters.categoryId
        );
        if (!hasCategory) return false;
      }

      // Pickup location filter
      if (filters.pickupLocation && order.pickup_location !== filters.pickupLocation) {
        return false;
      }

      return true;
    });
  };

  const getFilteredOrders = (status: string) => {
    console.log('Filtering orders for status:', status, 'Total orders:', orders?.length);
    const statusFiltered = orders?.filter(order => order.status === status) || [];
    return filterOrders(statusFiltered);
  };

  // Extract unique categories from orders
  const uniqueCategories = new Set();
  const categories = orders?.flatMap(order => 
    order.order_items?.map(item => {
      const category = item.menu_item?.category;
      if (category && !uniqueCategories.has(category.id)) {
        uniqueCategories.add(category.id);
        return {
          id: category.id,
          name: category.name,
          name_ko: category.name_ko
        };
      }
      return null;
    })
  )
  .filter(Boolean) || [];

  // Extract unique pickup locations from orders
  const pickupLocations = Array.from(new Set(
    orders?.map(order => order.pickup_location).filter(Boolean) || []
  ));

  const renderOrdersList = (filteredOrders: Order[]) => {
    if (filteredOrders.length === 0) {
      return <p className="text-center text-gray-500">No orders found</p>;
    }

    return filteredOrders.map((order) => (
      <OrderCard 
        key={order.id} 
        order={order}
        onDelete={handleDelete}
      >
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
      
      <OrderFilters 
        onFilterChange={setFilters}
        categories={categories}
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