
import { useMemo } from 'react';
import { Order } from '@/components/vendor/types';
import { UnifiedOrder, OrderGroup } from '@/types/unifiedOrder';

export const useCustomerUnifiedOrders = (orders: Order[]) => {
  const unifiedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Group orders by order ID - each order should generate exactly one card
    // regardless of how many categories or items it contains
    const orderMap = new Map<string, Order[]>();
    
    orders.forEach(order => {
      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, []);
      }
      orderMap.get(order.id)!.push(order);
    });

    // Convert each group to a unified order
    return Array.from(orderMap.entries()).map(([orderId, orderGroup]) => {
      // Use the first order as the base since they all represent the same transaction
      const baseOrder = orderGroup[0];
      
      // Create category details from all order items
      const categoryDetails = [{
        categoryId: baseOrder.order_items?.[0]?.menu_item?.category?.id || baseOrder.id,
        categoryName: baseOrder.order_items?.[0]?.menu_item?.category?.name || 'Mixed Items',
        categoryNameKo: baseOrder.order_items?.[0]?.menu_item?.category?.name_ko,
        fulfillmentType: (baseOrder.fulfillment_type as 'pickup' | 'delivery') || 'delivery',
        deliveryDate: baseOrder.delivery_date,
        deliveryAddress: baseOrder.delivery_address,
        deliveryTimeSlot: baseOrder.delivery_time_slot,
        pickupTime: baseOrder.pickup_time,
        pickupLocation: baseOrder.pickup_location,
        status: baseOrder.status,
        items: baseOrder.order_items?.map(item => ({
          id: item.id,
          name: item.menu_item?.name || '',
          nameKo: item.menu_item?.name_ko,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discountPercentage: item.discount_percentage || item.menu_item?.discount_percentage
        })) || [],
        subtotal: baseOrder.total_amount
      }];

      const unifiedOrder: UnifiedOrder = {
        id: baseOrder.id,
        customerId: baseOrder.customer_id,
        customerName: baseOrder.customer?.full_name || baseOrder.customer_name || '',
        customerEmail: baseOrder.customer?.email || baseOrder.customer_email || '',
        customerPhone: baseOrder.customer?.phone || baseOrder.customer_phone,
        customer: baseOrder.customer,
        totalAmount: baseOrder.total_amount,
        discountAmount: baseOrder.discount_amount || 0,
        taxAmount: baseOrder.tax_amount || 0,
        createdAt: baseOrder.created_at,
        overallStatus: baseOrder.status,
        notes: baseOrder.notes,
        paymentProofUrl: baseOrder.payment_proof_url,
        rejectionReason: baseOrder.rejection_reason,
        categoryDetails,
        relatedOrderIds: [baseOrder.id]
      };

      return {
        unifiedOrder,
        originalOrders: orderGroup
      } as OrderGroup;
    });
  }, [orders]);

  return unifiedOrders;
};
