
import { useMemo } from 'react';
import { Order } from '@/components/vendor/types';
import { UnifiedOrder, OrderGroup } from '@/types/unifiedOrder';

export const useCustomerUnifiedOrders = (orders: Order[]) => {
  const unifiedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Group orders by the exact same customer and order ID since each order should be unified by default
    // No time-based grouping to avoid edge cases with quick successive orders
    const orderGroups: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      // Use the order ID as the key to ensure each order is treated separately
      const groupKey = order.id;
      
      if (!orderGroups[groupKey]) {
        orderGroups[groupKey] = [];
      }
      orderGroups[groupKey].push(order);
    });

    // Convert groups to unified orders
    return Object.values(orderGroups).map(groupOrders => {
      const mainOrder = groupOrders[0]; // Since we're grouping by ID, there's only one order per group
      
      // Calculate category details
      const categoryDetails = [{
        categoryId: mainOrder.order_items?.[0]?.menu_item?.category?.id || mainOrder.id,
        categoryName: mainOrder.order_items?.[0]?.menu_item?.category?.name || 'Mixed Items',
        categoryNameKo: mainOrder.order_items?.[0]?.menu_item?.category?.name_ko,
        fulfillmentType: (mainOrder.fulfillment_type as 'pickup' | 'delivery') || 'delivery',
        deliveryDate: mainOrder.delivery_date,
        deliveryAddress: mainOrder.delivery_address,
        deliveryTimeSlot: mainOrder.delivery_time_slot,
        pickupTime: mainOrder.pickup_time,
        pickupLocation: mainOrder.pickup_location,
        status: mainOrder.status,
        items: mainOrder.order_items?.map(item => ({
          id: item.id,
          name: item.menu_item?.name || '',
          nameKo: item.menu_item?.name_ko,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discountPercentage: item.discount_percentage || item.menu_item?.discount_percentage
        })) || [],
        subtotal: mainOrder.total_amount
      }];

      const unifiedOrder: UnifiedOrder = {
        id: mainOrder.id,
        customerId: mainOrder.customer_id,
        customerName: mainOrder.customer?.full_name || mainOrder.customer_name || '',
        customerEmail: mainOrder.customer?.email || mainOrder.customer_email || '',
        customerPhone: mainOrder.customer?.phone || mainOrder.customer_phone,
        customer: mainOrder.customer,
        totalAmount: mainOrder.total_amount,
        discountAmount: mainOrder.discount_amount || 0,
        taxAmount: mainOrder.tax_amount || 0,
        createdAt: mainOrder.created_at,
        overallStatus: mainOrder.status,
        notes: mainOrder.notes,
        paymentProofUrl: mainOrder.payment_proof_url,
        rejectionReason: mainOrder.rejection_reason,
        categoryDetails,
        relatedOrderIds: [mainOrder.id]
      };

      return {
        unifiedOrder,
        originalOrders: groupOrders
      } as OrderGroup;
    });
  }, [orders]);

  return unifiedOrders;
};
