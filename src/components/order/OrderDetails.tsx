import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderStatusBadge } from '../shared/OrderStatusBadge';
import { Card } from '../ui/card';

interface OrderDetailsProps {
  order: any; // Type should be properly defined based on your order structure
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const { language } = useLanguage();

  return (
    <Card key={order.id} className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(order.created_at), 'PPP')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.customer && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Customer Details</h3>
          <p className="text-sm">Name: {order.customer.full_name}</p>
          <p className="text-sm">Email: {order.customer.email}</p>
          {order.customer.phone && (
            <p className="text-sm">Phone: {order.customer.phone}</p>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="font-medium mb-2">Order Items</h3>
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center py-2 border-b">
            <div>
              <span className="font-medium">
                {item.quantity}x {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}
              </span>
              <p className="text-sm text-gray-600">
                ${item.unit_price.toFixed(2)} each
              </p>
            </div>
            <span className="font-medium">
              ${(item.quantity * item.unit_price).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${(order.total_amount - order.tax_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${order.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {order.notes}
          </p>
        </div>
      )}

      {order.rejection_reason && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-red-600">
            <span className="font-medium">Rejection Reason:</span> {order.rejection_reason}
          </p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Delivery Date:</span>{' '}
          {format(new Date(order.delivery_date), 'PPP')}
        </p>
      </div>
    </Card>
  );
}