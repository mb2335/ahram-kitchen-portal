import { useSession } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatusBadge } from './shared/OrderStatusBadge';

export function OrderHistory() {
  const session = useSession();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: orders, isLoading } = useOrders();

  if (!session) {
    navigate('/auth', { state: { returnTo: '/orders' } });
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      <div className="space-y-4">
        {orders?.map((order) => (
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

            {/* Customer Details */}
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
            
            {/* Order Items */}
            <div className="space-y-2">
              <h3 className="font-medium mb-2">Order Items</h3>
              {order.order_items?.map((item) => (
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
            
            {/* Order Summary */}
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

            {/* Additional Order Information */}
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
        ))}

        {orders?.length === 0 && (
          <Card className="p-6 text-center">
            <p>You haven't placed any orders yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}