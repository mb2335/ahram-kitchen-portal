
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Order, OrderStatus } from './types';
import { UnifiedOrderCard } from './order/UnifiedOrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useOrders';
import { useUnifiedOrders } from '@/hooks/useUnifiedOrders';
import { OrderFilters } from './order/OrderFilters';
import type { OrderFilters as OrderFiltersType } from './order/OrderFilters';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { SendSMSDialog } from './order/SendSMSDialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function OrderManagement() {
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [viewMode, setViewMode] = useState<'unified' | 'detailed'>('unified');
  const { toast } = useToast();
  const { orders, updateOrderStatus, deleteOrder, refetch } = useVendorOrders();
  const unifiedOrderGroups = useUnifiedOrders(orders || []);

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

  // Helper function to normalize dates for comparison
  const normalizeDateForComparison = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const filterOrders = (orders: Order[]) => {
    return orders?.filter(order => {
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

  const getFilteredOrders = (status: string) => {
    console.log('Filtering orders for status:', status, 'Total orders:', orders?.length);
    const statusFiltered = orders?.filter(order => order.status === status) || [];
    return filterOrders(statusFiltered);
  };

  const getFilteredUnifiedOrders = (status: string) => {
    return unifiedOrderGroups.filter(group => 
      group.unifiedOrder.overallStatus === status &&
      group.originalOrders.some(order => filterOrders([order]).length > 0)
    );
  };

  // Extract unique pickup locations from orders
  const pickupLocations = Array.from(new Set(
    orders?.map(order => order.pickup_location).filter(Boolean) || []
  ));

  // Filter orders excluding rejected ones for counts
  const validOrders = orders?.filter(order => order.status !== 'rejected') || [];

  // Count orders by fulfillment type (excluding rejected orders)
  const pickupCount = validOrders.filter(order => order.fulfillment_type === FULFILLMENT_TYPE_PICKUP).length;
  const deliveryCount = validOrders.filter(order => order.fulfillment_type === FULFILLMENT_TYPE_DELIVERY).length;

  const renderOrdersList = (status: string) => {
    if (viewMode === 'unified') {
      const filteredUnifiedOrders = getFilteredUnifiedOrders(status);
      
      if (filteredUnifiedOrders.length === 0) {
        return <p className="text-center text-gray-500">No orders found</p>;
      }

      return filteredUnifiedOrders.map((orderGroup) => (
        <UnifiedOrderCard 
          key={orderGroup.unifiedOrder.id} 
          unifiedOrder={orderGroup.unifiedOrder}
          onDelete={handleDelete}
        >
          <OrderStatusActions
            status={orderGroup.unifiedOrder.overallStatus as OrderStatus}
            onUpdateStatus={(status, reason) => {
              // Update status for all related orders
              orderGroup.originalOrders.forEach(order => 
                handleStatusUpdate(order.id, status, reason)
              );
            }}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
          />
        </UnifiedOrderCard>
      ));
    } else {
      // Detailed view - keep existing functionality
      const filteredOrders = getFilteredOrders(status);
      
      if (filteredOrders.length === 0) {
        return <p className="text-center text-gray-500">No orders found</p>;
      }

      return filteredOrders.map((order) => (
        <div key={order.id}>
          {/* Original OrderCard would go here - keeping for backward compatibility */}
          <p>Detailed view: Order {order.id.substring(0, 8)}</p>
        </div>
      ));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-4">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'unified' | 'detailed')}
            className="border rounded-md"
          >
            <ToggleGroupItem value="unified">Unified View</ToggleGroupItem>
            <ToggleGroupItem value="detailed">Detailed View</ToggleGroupItem>
          </ToggleGroup>
          <SendSMSDialog 
            orders={orders || []}
            pickupLocations={pickupLocations}
          />
        </div>
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
          <p className="text-3xl font-bold">{validOrders.length || 0}</p>
        </div>
      </div>
      
      <OrderFilters 
        onFilterChange={setFilters}
        pickupLocations={pickupLocations}
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({viewMode === 'unified' 
              ? getFilteredUnifiedOrders('pending').length 
              : getFilteredOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({viewMode === 'unified' 
              ? getFilteredUnifiedOrders('confirmed').length 
              : getFilteredOrders('confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({viewMode === 'unified' 
              ? getFilteredUnifiedOrders('completed').length 
              : getFilteredOrders('completed').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({viewMode === 'unified' 
              ? getFilteredUnifiedOrders('rejected').length 
              : getFilteredOrders('rejected').length})
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
