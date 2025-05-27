
import { useMemo } from 'react';
import { Order } from '@/components/vendor/types';
import { UnifiedOrder, OrderGroup } from '@/types/unifiedOrder';

export const useCustomerUnifiedOrders = (orders: Order[]) => {
  const unifiedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // For customer orders, each order should be its own unified order
    // Unlike vendor orders which might group by customer and time window
    return orders.map(order => {
      // Create category details from the order items
      const categoryDetails = [{
        categoryId: order.order_items?.[0]?.menu_item?.category?.id || order.id,
        categoryName: order.order_items?.[0]?.menu_item?.category?.name || 'Mixed Items',
        categoryNameKo: order.order_items?.[0]?.menu_item?.category?.name_ko,
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
      }];

      const unifiedOrder: UnifiedOrder = {
        id: order.id,
        customerId: order.customer_id,
        customerName: order.customer?.full_name || order.customer_name || '',
        customerEmail: order.customer?.email || order.customer_email || '',
        customerPhone: order.customer?.phone || order.customer_phone,
        customer: order.customer,
        totalAmount: order.total_amount,
        discountAmount: order.discount_amount || 0,
        taxAmount: order.tax_amount || 0,
        createdAt: order.created_at,
        overallStatus: order.status,
        notes: order.notes,
        paymentProofUrl: order.payment_proof_url,
        rejectionReason: order.rejection_reason,
        categoryDetails,
        relatedOrderIds: [order.id]
      };

      return {
        unifiedOrder,
        originalOrders: [order]
      } as OrderGroup;
    });
  }, [orders]);

  return unifiedOrders;
};
