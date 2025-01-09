import { Order } from './types';
import { OrderHeader } from './order/OrderHeader';
import { CustomerDetails } from './order/CustomerDetails';
import { OrderItems } from './order/OrderItems';
import { OrderSummary } from './order/OrderSummary';
import { PaymentProof } from './order/PaymentProof';
import { OrderNotes } from './order/OrderNotes';
import { OrderActions } from './order/OrderActions';
import { PickupDetails } from './order/PickupDetails';

interface OrderCardProps {
  order: Order;
  onDelete?: (orderId: string) => void;
  children?: React.ReactNode;
}

export function OrderCard({ order, onDelete, children }: OrderCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <OrderHeader order={order} />
      
      {order.customer && (
        <CustomerDetails customer={order.customer} />
      )}

      {order.order_items && (
        <OrderItems items={order.order_items} />
      )}

      <OrderSummary 
        subtotal={order.total_amount - order.tax_amount}
        taxAmount={order.tax_amount}
        total={order.total_amount}
      />
      
      <PickupDetails 
        pickupDate={order.delivery_date}
        pickupTime={order.pickup_time}
        pickupLocation={order.pickup_location}
      />
      
      <PaymentProof paymentProofUrl={order.payment_proof_url} />

      <OrderNotes 
        notes={order.notes} 
        rejectionReason={order.rejection_reason} 
      />

      <OrderActions 
        onDelete={onDelete} 
        orderId={order.id}
      >
        {children}
      </OrderActions>
    </div>
  );
}