import { Card } from '@/components/ui/card';
import { OrderStatusSection } from './OrderStatusSection';
import { CustomerSection } from './CustomerSection';
import { UnifiedOrderItems } from '@/components/shared/UnifiedOrderItems';
import { OrderNotes } from './OrderNotes';
import { DeliveryInfo } from './DeliveryInfo';
import { MapPin, Clock, ChevronDown, ChevronRight, Calendar, Truck } from 'lucide-react';
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
  
  useEffect(() => {
    const loadRelatedOrders = async () => {
      if (!order || !order.id) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            unit_price,
            discount_percentage,
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

  // Calculate total discount based on order items discount_percentage
  const totalDiscount = order.order_items?.reduce((acc: number, item: any) => {
    if (!item.discount_percentage) return acc;
    const originalPrice = item.unit_price * item.quantity;
    const discountAmount = (originalPrice * (item.discount_percentage / 100));
    return acc + discountAmount;
  }, 0) || 0;

  // Use the order's discount_amount field if available, otherwise use calculated value
  const discountAmount = order.discount_amount !== null ? order.discount_amount : totalDiscount;

  // Format items with proper category information from menu items - preserve each item's category
  const formattedItems = order.order_items?.map((item: any) => ({
    id: item.id,
    name: item.menu_item?.name || 'Unknown Item',
    nameKo: item.menu_item?.name_ko,
    quantity: item.quantity,
    price: item.unit_price,
    discount_percentage: item.discount_percentage,
    // Keep the actual category of each individual item
    category: item.menu_item?.category ? {
      name: item.menu_item.category.name,
      name_ko: item.menu_item.category.name_ko
    } : undefined
  })) || [];

  const isMultiFulfillment = relatedOrders.length > 0;

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="p-6 space-y-6">
        <OrderStatusSection
          id={order.id}
          status={order.status}
          createdAt={order.created_at}
        />

        {order.customer && (
          <CustomerSection customer={order.customer} />
        )}
        
        {/* Modern unified items display - each item shows its own category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <UnifiedOrderItems items={formattedItems} showPricing={true} />
        </div>

        <OrderSummary
          items={formattedItems}
          subtotal={order.total_amount + discountAmount}
          total={order.total_amount}
          discountAmount={discountAmount}
        />

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">
              {order.fulfillment_type === 'pickup'
                ? 'Pickup Details'
                : order.fulfillment_type === 'delivery'
                  ? 'Delivery Details'
                  : 'Order Details'}
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(order.delivery_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              
              {order.fulfillment_type === 'pickup' && (
                <>
                  {order.pickup_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{order.pickup_time}</span>
                    </div>
                  )}
                  {order.pickup_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{order.pickup_location}</span>
                    </div>
                  )}
                </>
              )}

              {order.fulfillment_type === 'delivery' && (
                <>
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-1" />
                    <div>
                      <div className="font-medium">Delivery Address:</div>
                      <div className="whitespace-pre-line">
                        {order.delivery_address || "No address provided"}
                      </div>
                    </div>
                  </div>
                  {order.delivery_time_slot && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Delivery Time: {order.delivery_time_slot}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

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
      </div>
    </Card>
  );
}
