import { Order } from '../types';

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="border-t pt-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${(order.total_amount - order.tax_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>${order.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${order.total_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}