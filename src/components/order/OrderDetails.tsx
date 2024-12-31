import { Card } from '@/components/ui/card';
import { OrderStatusSection } from './OrderStatusSection';
import { CustomerSection } from './CustomerSection';
import { OrderItemsList } from './OrderItemsList';
import { OrderTotals } from './OrderTotals';
import { OrderNotes } from './OrderNotes';
import { DeliveryInfo } from './DeliveryInfo';

interface OrderDetailsProps {
  order: any; // Type should be properly defined based on your order structure
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const subtotal = order.total_amount - order.tax_amount;

  return (
    <Card className="p-6">
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
      />

      <OrderNotes
        notes={order.notes}
        rejectionReason={order.rejection_reason}
      />

      <DeliveryInfo deliveryDate={order.delivery_date} />
    </Card>
  );
}