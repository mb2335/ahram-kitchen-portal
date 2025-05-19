
import { Order } from '../types';
import { formatCurrency } from '@/utils/formatters';
import { formatTime } from '@/types/delivery';

interface OrderDetailsProps {
  order: Order;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  // First check if there's a stored discount amount
  let discountAmount = order.discount_amount || 0;
  
  // If no stored discount amount, calculate it from order items
  if (!discountAmount) {
    discountAmount = order.order_items?.reduce((acc, item) => {
      if (!item.discount_percentage && !item.menu_item?.discount_percentage) return acc;
      const discountPercentage = item.discount_percentage || item.menu_item?.discount_percentage || 0;
      const itemTotal = item.unit_price * item.quantity;
      return acc + (itemTotal * (discountPercentage / 100));
    }, 0) || 0;
  }

  // Calculate subtotal before discounts
  const subtotalBeforeDiscount = order.total_amount + discountAmount;

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h4 className="font-medium mb-2">Order Details</h4>
      <div className="space-y-2">
        <p className="text-sm">Status: <span className="font-medium capitalize">{order.status}</span></p>
        <p className="text-sm">Date: {new Date(order.created_at).toLocaleDateString()}</p>
        
        {order.delivery_date && (
          <p className="text-sm">Delivery Date: {new Date(order.delivery_date).toLocaleDateString()}</p>
        )}
        
        {order.fulfillment_type && (
          <p className="text-sm">Type: <span className="capitalize">{order.fulfillment_type}</span></p>
        )}

        {/* Display pickup details only for pickup orders */}
        {order.fulfillment_type === 'pickup' && (
          <div className="pt-2">
            {order.pickup_time && (
              <p className="text-sm">
                Pickup Time: <span className="font-medium">{formatTime(order.pickup_time)}</span>
              </p>
            )}
            {order.pickup_location && (
              <p className="text-sm">
                Pickup Location: <span className="font-medium">{order.pickup_location}</span>
              </p>
            )}
          </div>
        )}

        {/* Display delivery address only for delivery orders */}
        {order.fulfillment_type === 'delivery' && order.delivery_address && (
          <div className="pt-2">
            <p className="text-sm font-medium">Delivery Address:</p>
            <p className="text-sm whitespace-pre-line">{order.delivery_address}</p>
          </div>
        )}

        <div className="border-t pt-2 mt-2">
          <p className="text-sm">Subtotal: {formatCurrency(subtotalBeforeDiscount)}</p>
          {discountAmount > 0 && (
            <p className="text-sm text-red-500">Discount: -{formatCurrency(discountAmount)}</p>
          )}
          <p className="text-sm font-bold">Total: {formatCurrency(order.total_amount)}</p>
        </div>
      </div>
    </div>
  );
}
