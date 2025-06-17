
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { OrderStatus } from './types';
import { UnifiedOrderCard } from './order/UnifiedOrderCard';
import { OrderStatusActions } from './OrderStatusActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from '@/hooks/useVendorOrders';
import { useUnifiedOrders } from '@/hooks/useUnifiedOrders';
import { OrderFilters } from './order/OrderFilters';
import type { OrderFilters as OrderFiltersType } from './order/OrderFilters';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { SendSMSDialog } from './order/SendSMSDialog';
import { OrderActions } from './order/OrderActions';

export function OrderManagement() {
  const [rejectionReason, setRejectionReason] = useState('');
  const [filters, setFilters] = useState<OrderFiltersType>({});
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

  const handleUnifiedOrderStatusUpdate = async (orderGroup: any, status: string, reason?: string) => {
    console.log('Handling unified order status update:', { orderGroup: orderGroup.unifiedOrder.id, status, reason });
    
    // Update status for all related orders but only send notification for the first one
    let hasError = false;
    let errorMessage = '';
    let successCount = 0;

    for (let i = 0; i < orderGroup.originalOrders.length; i++) {
      const order = orderGroup.originalOrders[i];
      const isFirstOrder = i === 0;
      
      // Use the hook's updateOrderStatus method with skipNotification for all but first order
      const result = await updateOrderStatus(order.id, status, reason, !isFirstOrder);
      
      if (result.success) {
        successCount++;
      } else {
        hasError = true;
        errorMessage = result.error;
        break;
      }
    }

    if (hasError) {
      toast({
        title: 'Error updating order status',
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: status === 'rejected' 
          ? `Order rejected${reason ? ': ' + reason : ''}`
          : `Order ${status} successfully`,
      });
      await refetch();
    }
  };

  const handleUnifiedOrderDelete = async (unifiedOrderId: string) => {
    try {
      // Find the unified order group
      const orderGroup = unifiedOrderGroups.find(group => group.unifiedOrder.id === unifiedOrderId);
      if (!orderGroup) {
        throw new Error('Order group not found');
      }

      // Delete all related orders
      let hasError = false;
      let errorMessage = '';

      for (const order of orderGroup.originalOrders) {
        const result = await deleteOrder(order.id);
        if (!result.success) {
          hasError = true;
          errorMessage = result.error;
          break;
        }
      }

      if (hasError) {
        throw new Error(errorMessage);
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

  const getFilteredUnifiedOrders = (status: string) => {
    return unifiedOrderGroups.filter(group => {
      // Status filtering
      if (group.unifiedOrder.overallStatus !== status) {
        return false;
      }

      // Apply filters to at least one order in the group
      return group.originalOrders.some(order => {
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
      });
    });
  };

  // Extract unique pickup locations from orders with proper typing
  const pickupLocations: string[] = Array.from(new Set(
    (orders || [])
      .map(order => order.pickup_location)
      .filter((location): location is string => typeof location === 'string' && location.length > 0)
  ));

  const renderOrdersList = (status: string) => {
    const filteredUnifiedOrders = getFilteredUnifiedOrders(status);
    
    if (filteredUnifiedOrders.length === 0) {
      return <p className="text-center text-gray-500">No orders found</p>;
    }

    return filteredUnifiedOrders.map((orderGroup) => (
      <UnifiedOrderCard 
        key={orderGroup.unifiedOrder.id} 
        unifiedOrder={orderGroup.unifiedOrder}
        onDelete={handleUnifiedOrderDelete}
      >
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <OrderStatusActions
              status={orderGroup.unifiedOrder.overallStatus as OrderStatus}
              onUpdateStatus={(status, reason) => {
                handleUnifiedOrderStatusUpdate(orderGroup, status, reason);
              }}
              rejectionReason={rejectionReason}
              setRejectionReason={setRejectionReason}
            />
          </div>
          <OrderActions 
            orderId={orderGroup.unifiedOrder.id}
            onDelete={handleUnifiedOrderDelete}
          />
        </div>
      </UnifiedOrderCard>
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
            Pending ({getFilteredUnifiedOrders('pending').length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed ({getFilteredUnifiedOrders('confirmed').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getFilteredUnifiedOrders('completed').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({getFilteredUnifiedOrders('rejected').length})
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
