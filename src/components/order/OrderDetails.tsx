
import { Card } from '@/components/ui/card';
import { OrderStatusSection } from './OrderStatusSection';
import { CustomerSection } from './CustomerSection';
import { OrderItemsList } from './OrderItemsList';
import { OrderNotes } from './OrderNotes';
import { DeliveryInfo } from './DeliveryInfo';
import { MapPin, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PaymentProof } from '@/components/vendor/order/PaymentProof';
import { OrderSummary } from '@/components/shared/OrderSummary';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OrderDetailsProps {
  order: any; // Type should be properly defined based on your order structure
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [relatedOrders, setRelatedOrders] = useState<any[]>([]);
  const [showRelatedOrders, setShowRelatedOrders] = useState(false);
  
  // Load related orders if any
  useEffect(() => {
    const loadRelatedOrders = async () => {
      if (!order || !order.id) return;
      
      // Find other orders with same customer and created within 1 minute
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            unit_price,
            menu_item:menu_items (
              id,
              name,
              name_ko,
              category:menu_categories (
                id,
                name,
                name_ko
              )
            )
          )
        `)
        .eq('customer_id', order.customer_id)
        .neq('id', order.id)
        .gte('created_at', new Date(new Date(order.created_at).getTime() - 60000).toISOString())
        .lte('created_at', new Date(new Date(order.created_at).getTime() + 60000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading related orders:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setRelatedOrders(data);
        setShowRelatedOrders(true);
      }
    };
    
    loadRelatedOrders();
  }, [order]);

  // Calculate total discount from order items
  const totalDiscount = order.order_items?.reduce((acc: number, item: any) => {
    const originalPrice = item.unit_price * item.quantity;
    const discountAmount = item.menu_item?.discount_percentage 
      ? (originalPrice * (item.menu_item.discount_percentage / 100))
      : 0;
    return acc + discountAmount;
  }, 0) || 0;

  const formattedItems = order.order_items?.map((item: any) => ({
    name: item.menu_item?.name,
    nameKo: item.menu_item?.name_ko,
    quantity: item.quantity,
    price: item.unit_price,
    discount_percentage: item.menu_item?.discount_percentage,
    category: item.menu_item?.category
  })) || [];

  // Check if this is a multi-fulfillment order
  const isMultiFulfillment = relatedOrders.length > 0;

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
      
      <OrderSummary
        items={formattedItems}
        subtotal={order.total_amount - order.tax_amount + totalDiscount}
        taxAmount={order.tax_amount}
        total={order.total_amount}
        discountAmount={totalDiscount}
      />

      <div className="space-y-4">
        <DeliveryInfo 
          deliveryDate={order.delivery_date} 
          fulfillmentType={order.fulfillment_type}
          deliveryAddress={order.delivery_address}
        />

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

      {/* Show related orders section if this is a multi-fulfillment order */}
      {isMultiFulfillment && (
        <div className="mt-4">
          <Separator className="my-4" />
          <Collapsible open={showRelatedOrders} onOpenChange={setShowRelatedOrders}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
              <span>Related Orders ({relatedOrders.length})</span>
              {showRelatedOrders ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-4">
              {relatedOrders.map((relatedOrder) => (
                <div key={relatedOrder.id} className="border p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">Order ID: {relatedOrder.id.substring(0, 8)}</h4>
                    <span className={`text-sm px-2 py-1 rounded ${
                      relatedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      relatedOrder.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      relatedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {relatedOrder.status.charAt(0).toUpperCase() + relatedOrder.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">
                    <strong>{relatedOrder.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'} Date:</strong> {' '}
                    {new Date(relatedOrder.delivery_date).toLocaleDateString()}
                  </p>
                  
                  {relatedOrder.fulfillment_type === 'delivery' && relatedOrder.delivery_address && (
                    <p className="text-sm mb-2"><strong>Delivery Address:</strong> {relatedOrder.delivery_address}</p>
                  )}
                  
                  {relatedOrder.fulfillment_type === 'pickup' && (
                    <>
                      {relatedOrder.pickup_time && (
                        <p className="text-sm mb-2"><strong>Pickup Time:</strong> {relatedOrder.pickup_time}</p>
                      )}
                      {relatedOrder.pickup_location && (
                        <p className="text-sm mb-2"><strong>Pickup Location:</strong> {relatedOrder.pickup_location}</p>
                      )}
                    </>
                  )}
                  
                  <div className="mt-2">
                    <h5 className="text-sm font-medium mb-1">Items:</h5>
                    <ul className="text-sm">
                      {relatedOrder.order_items.map((item: any) => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.menu_item?.name}</span>
                          <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {order.payment_proof_url && (
        <PaymentProof paymentProofUrl={order.payment_proof_url} />
      )}

      {(order.notes || order.rejection_reason) && (
        <OrderNotes
          notes={order.notes}
          rejectionReason={order.rejection_reason}
        />
      )}
    </Card>
  );
}
