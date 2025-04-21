
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { OrderCard } from './OrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useOrders';
import { OrderFilters } from './order/OrderFilters';
import type { OrderFilters as OrderFiltersType } from './order/OrderFilters';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { SendSMSDialog } from './order/SendSMSDialog';

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
      // Date filtering - compare only the date portion, not time
      if (filters.date) {
        const selectedDate = new Date(filters.date);
        const orderDate = new Date(order.delivery_date);
        
        // Compare year, month, and day only
        if (
          selectedDate.getFullYear() !== orderDate.getFullYear() ||
          selectedDate.getMonth() !== orderDate.getMonth() ||
          selectedDate.getDate() !== orderDate.getDate()
        ) {
          return false;
        }
      }

      // Category filtering - check if any item in the order belongs to the selected category
      if (filters.categoryId) {
        const hasCategory = order.order_items?.some(item => 
          item.menu_item?.category?.id === filters.categoryId
        );
        if (!hasCategory) return false;
      }

      // Fulfillment type filtering
      if (filters.fulfillmentType && order.fulfillment_type !== filters.fulfillmentType) {
        return false;
      }

      // Pickup location filtering
      if (filters.pickupLocation && order.pickup_location !== filters.pickupLocation) {
        return false;
      }

      return true;
    }) || [];
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

  // Count orders by fulfillment type
  const pickupCount = orders?.filter(order => order.fulfillment_type === FULFILLMENT_TYPE_PICKUP).length || 0;
  const deliveryCount = orders?.filter(order => order.fulfillment_type === FULFILLMENT_TYPE_DELIVERY).length || 0;

  const getSMSRecipients = (orders: Order[]) => {
    return orders
      .filter(order => order.customer?.phone)
      .map(order => ({
        phone: order.customer!.phone!,
        name: order.customer!.full_name
      }));
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <SendSMSDialog 
          orders={filterOrders(orders || [])}
          categories={categories}
          pickupLocations={pickupLocations}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium mb-2">Pickup Orders (Thu-Fri)</h3>
          <p className="text-3xl font-bold">{pickupCount}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium mb-2">Delivery Orders</h3>
          <p className="text-3xl font-bold">{deliveryCount}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <h3 className="text-lg font-medium mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{orders?.length || 0}</p>
        </div>
      </div>
      
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

