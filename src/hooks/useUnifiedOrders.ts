
import { useMemo } from 'react';
import { Order } from '@/components/vendor/types';
import { UnifiedOrder, OrderGroup, CategoryFulfillmentDetail } from '@/types/unifiedOrder';

export const useUnifiedOrders = (orders: Order[]) => {
  const unifiedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Group orders by customer and creation time window (within 5 minutes)
    const orderGroups: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      // Create a key based on customer info and rounded timestamp (5-minute windows)
      const customerKey = order.customer_email || order.customer_id || 'unknown';
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
      
      // Calculate category details
      const categoryDetails: CategoryFulfillmentDetail[] = groupOrders.map(order => {
        const categoryName = order.order_items?.[0]?.menu_item?.category?.name || 'Unknown Category';
        const categoryNameKo = order.order_items?.[0]?.menu_item?.category?.name_ko;
        const categoryId = order.order_items?.[0]?.menu_item?.category?.id || order.id;
        
        return {
          categoryId,
          categoryName,
          categoryNameKo,
          fulfillmentType: (order.fulfillment_type as 'pickup' | 'delivery') || 'delivery',
          deliveryDate: order.delivery_date,
          deliveryAddress: order.delivery_address,
          deliveryTimeSlot: order.delivery_time_slot,
          pickupTime: order.pickup_time,
          pickupLocation: order.pickup_location,
          status: order.status,
          items: order.order_items?.map(item => ({
            id: item.id,
            name: item.menu_item?.name || '',
            nameKo: item.menu_item?.name_ko,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            discountPercentage: item.discount_percentage || item.menu_item?.discount_percentage
          })) || [],
          subtotal: order.total_amount
        };
      });

      // Calculate overall status (prioritize pending/rejected over completed)
      const statuses = groupOrders.map(o => o.status);
      let overallStatus = 'completed';
      if (statuses.includes('rejected')) overallStatus = 'rejected';
      else if (statuses.includes('pending')) overallStatus = 'pending';
      else if (statuses.includes('confirmed')) overallStatus = 'confirmed';

      const unifiedOrder: UnifiedOrder = {
        id: mainOrder.id,
        customerId: mainOrder.customer_id,
        customerName: mainOrder.customer?.full_name || mainOrder.customer_name || '',
        customerEmail: mainOrder.customer?.email || mainOrder.customer_email || '',
        customerPhone: mainOrder.customer?.phone || mainOrder.customer_phone,
        customer: mainOrder.customer,
        totalAmount: groupOrders.reduce((sum, order) => sum + order.total_amount, 0),
        discountAmount: groupOrders.reduce((sum, order) => sum + (order.discount_amount || 0), 0),
        taxAmount: groupOrders.reduce((sum, order) => sum + (order.tax_amount || 0), 0),
        createdAt: mainOrder.created_at,
        overallStatus,
        notes: mainOrder.notes,
        paymentProofUrl: mainOrder.payment_proof_url,
        rejectionReason: mainOrder.rejection_reason,
        categoryDetails,
        relatedOrderIds: groupOrders.map(o => o.id)
      };

      return {
        unifiedOrder,
        originalOrders: groupOrders
      } as OrderGroup;
    });
  }, [orders]);

  return unifiedOrders;
};
