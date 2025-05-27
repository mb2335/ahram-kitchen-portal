
import { useMemo } from 'react';
import { OrderHistoryItem } from '@/types/order';
import { UnifiedOrder, CategoryFulfillmentDetail } from '@/types/unifiedOrder';

export const useCustomerUnifiedOrders = (orders: OrderHistoryItem[]) => {
  const unifiedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Group orders by customer and creation time window (within 5 minutes)
    const orderGroups: { [key: string]: OrderHistoryItem[] } = {};
    
    orders.forEach(order => {
      // Create a key based on customer info and rounded timestamp (5-minute windows)
      const customerKey = order.customer_email || 'unknown';
      const timeWindow = Math.floor(new Date(order.created_at).getTime() / 300000); // 5-minute windows
      const groupKey = `${customerKey}-${timeWindow}`;
      
      if (!orderGroups[groupKey]) {
        orderGroups[groupKey] = [];
      }
      orderGroups[groupKey].push(order);
    });

    // Convert groups to unified orders
    return Object.values(orderGroups).map(groupOrders => {
      // Sort by creation time to get the main order
      const sortedOrders = groupOrders.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const mainOrder = sortedOrders[0];
      
      // Calculate overall status (prioritize pending/rejected over completed)
      const statuses = groupOrders.map(o => o.status);
      let overallStatus = 'completed';
      if (statuses.includes('rejected')) overallStatus = 'rejected';
      else if (statuses.includes('pending')) overallStatus = 'pending';
      else if (statuses.includes('confirmed')) overallStatus = 'confirmed';

      const unifiedOrder: UnifiedOrder = {
        id: mainOrder.id,
        customerId: undefined,
        customerName: mainOrder.customer_name || '',
        customerEmail: mainOrder.customer_email || '',
        customerPhone: mainOrder.customer_phone,
        customer: undefined,
        totalAmount: groupOrders.reduce((sum, order) => sum + order.total_amount, 0),
        discountAmount: groupOrders.reduce((sum, order) => sum + (order.discount_amount || 0), 0),
        taxAmount: 0, // Not available in OrderHistoryItem
        createdAt: mainOrder.created_at,
        overallStatus,
        notes: undefined, // Not available in OrderHistoryItem
        paymentProofUrl: '', // Not available in OrderHistoryItem
        rejectionReason: mainOrder.rejection_reason,
        categoryDetails: groupOrders.map(order => ({
          categoryId: order.id, // Use order ID as category identifier
          categoryName: `Order ${order.id.substring(0, 8)}`,
          fulfillmentType: (order.fulfillment_type as 'pickup' | 'delivery') || 'delivery',
          deliveryDate: order.delivery_date,
          deliveryAddress: order.delivery_address,
          deliveryTimeSlot: order.delivery_time_slot,
          pickupTime: order.pickup_time,
          pickupLocation: order.pickup_location,
          status: order.status,
          items: [], // Items not available in OrderHistoryItem
          subtotal: order.total_amount
        })),
        relatedOrderIds: groupOrders.map(o => o.id)
      };

      return unifiedOrder;
    });
  }, [orders]);

  return unifiedOrders;
};
