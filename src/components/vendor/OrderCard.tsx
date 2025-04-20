import { Order } from './types';
import { OrderHeader } from './order/OrderHeader';
import { CustomerDetails } from './order/CustomerDetails';
import { OrderNotes } from './order/OrderNotes';
import { OrderActions } from './order/OrderActions';
import { PickupDetails } from './order/PickupDetails';
import { PaymentProof } from './order/PaymentProof';
import { OrderSummary } from '@/components/shared/OrderSummary';

interface OrderCardProps {
  order: Order;
  onDelete?: (orderId: string) => void;
  children?: React.ReactNode;
}

export function OrderCard({ order, onDelete, children }: OrderCardProps) {
  // Calculate total discount from order items
  const totalDiscount = order.order_items?.reduce((acc: number, item: any) => {
    const originalPrice = item.unit_price * item.quantity;
    const discountAmount = item.menu_item?.discount_percentage 
      ? (originalPrice * (item.menu_item.discount_percentage / 100))
      : 0;
    return acc + discountAmount;
  }, 0) || 0;

  const orderItems = order.order_items?.map(item => ({
    name: item.menu_item?.name || '',
    nameKo: item.menu_item?.name_ko || '',
    quantity: item.quantity,
    price: item.unit_price,
    discount_percentage: item.menu_item?.discount_percentage,
    category: item.menu_item?.category
  })) || [];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <OrderHeader order={order} />
      
      {order.customer && (
        <CustomerDetails customer={order.customer} />
      )}

      <OrderSummary 
        items={orderItems}
        subtotal={order.total_amount - order.tax_amount + totalDiscount}
        taxAmount={order.tax_amount}
        total={order.total_amount}
        discountAmount={totalDiscount}
      />
      
      <PickupDetails 
        pickupDate={order.delivery_date}
        pickupTime={order.pickup_time}
        pickupLocation={order.pickup_location}
        fulfillmentType={order.fulfillment_type}
        deliveryAddress={order.delivery_address}
        deliveryTimeSlot={order.delivery_time_slot}
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
