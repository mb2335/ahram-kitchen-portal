import { Card } from '@/components/ui/card';
import { OrderStatusSection } from './OrderStatusSection';
import { CustomerSection } from './CustomerSection';
import { OrderItemsList } from './OrderItemsList';
import { OrderTotals } from './OrderTotals';
import { OrderNotes } from './OrderNotes';
import { DeliveryInfo } from './DeliveryInfo';
import { MapPin, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface OrderDetailsProps {
  order: any; // Type should be properly defined based on your order structure
}

export function OrderDetails({ order }: OrderDetailsProps) {
  // Calculate total discount
  const totalDiscount = order.order_items?.reduce((acc: number, item: any) => {
    const originalPrice = item.quantity * item.unit_price;
    const discountAmount = item.menu_item?.discount_percentage
      ? (originalPrice * (item.menu_item.discount_percentage / 100))
      : 0;
    return acc + discountAmount;
  }, 0) || 0;

  // Calculate subtotal before discounts
  const subtotal = order.total_amount + totalDiscount - order.tax_amount;

  return (
    <Card className="p-6 space-y-6">
      <OrderStatusSection
        id={order.id}
        status={order.status}
        createdAt={order.created_at}
      />

      {order.customer && (
        <CustomerSection customer={order.customer} />
      )}
      
      <OrderItemsList items={order.order_items} />
      
      <OrderTotals
        subtotal={subtotal}
        taxAmount={order.tax_amount}
        total={order.total_amount}
        discountAmount={totalDiscount}
      />

      <div className="space-y-4">
        <DeliveryInfo deliveryDate={order.delivery_date} />

        {(order.pickup_time || order.pickup_location) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-medium">Pickup Details</h3>
              {order.pickup_time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{order.pickup_time}</span>
                </div>
              )}
              {order.pickup_location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{order.pickup_location}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {(order.notes || order.rejection_reason) && (
        <OrderNotes
          notes={order.notes}
          rejectionReason={order.rejection_reason}
        />
      )}
    </Card>
  );
}