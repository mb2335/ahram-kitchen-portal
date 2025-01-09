import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { format } from 'date-fns';
import { OrderSummary } from '@/components/shared/OrderSummary';
import { CustomerSection } from './CustomerSection';
import { DeliveryInfo } from './DeliveryInfo';
import { OrderNotes } from './OrderNotes';
import { OrderStatusSection } from './OrderStatusSection';

interface OrderDetailsProps {
  order: any; // Using any temporarily, should be properly typed
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const orderItems = order.order_items?.map((item: any) => ({
    name: item.menu_item?.name || '',
    nameKo: item.menu_item?.name_ko || '',
    quantity: item.quantity,
    price: item.unit_price,
    category: item.menu_item?.category
  })) || [];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">
              Order #{order.id.slice(0, 8)}
            </h3>
            <p className="text-sm text-gray-500">
              Placed on {format(new Date(order.created_at), 'PPP')}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <OrderSummary
          items={orderItems}
          subtotal={order.total_amount - order.tax_amount}
          taxAmount={order.tax_amount}
          total={order.total_amount}
          showItems={isExpanded}
        />

        {isExpanded && (
          <div className="space-y-6 mt-4">
            <CustomerSection customer={order.customer} />
            <DeliveryInfo 
              deliveryDate={order.delivery_date}
              pickupTime={order.pickup_time}
              pickupLocation={order.pickup_location}
            />
            <OrderNotes notes={order.notes} />
            <OrderStatusSection 
              id={order.id}
              status={order.status}
              createdAt={order.created_at}
              rejectionReason={order.rejection_reason}
            />
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </Card>
  );
}