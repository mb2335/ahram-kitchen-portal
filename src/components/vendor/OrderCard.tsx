
import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Order } from './types';
import { CustomerDetails } from './order/CustomerDetails';
import { OrderItems } from './order/OrderItems';
import { OrderDetails } from './order/OrderDetails';
import { OrderActions } from './order/OrderActions';
import { formatCurrency } from '@/utils/formatters';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  onDelete?: (id: string) => void;
}

export function OrderCard({ order, children, onDelete }: OrderCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">
              Order #{order.id.substring(0, 8)}
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_at), 'PPpp')}
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <p className="text-lg font-bold">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CustomerDetails 
            customer={order.customer} 
            customerName={order.customer_name}
            customerEmail={order.customer_email}
            customerPhone={order.customer_phone}
          />
          <OrderDetails order={order} />
        </div>

        <OrderItems items={order.order_items} />

        <div className="mt-4 border-t pt-4">
          {children}
          
          {onDelete && (
            <div className="mt-4">
              <OrderActions orderId={order.id} onDelete={onDelete} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
