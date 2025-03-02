
import { format } from 'date-fns';
import { Truck, Store } from 'lucide-react';
import { FULFILLMENT_TYPE_DELIVERY, FULFILLMENT_TYPE_PICKUP } from '@/types/order';

interface DeliveryInfoProps {
  deliveryDate: string;
  fulfillmentType?: string;
  deliveryAddress?: string;
}

export function DeliveryInfo({ 
  deliveryDate, 
  fulfillmentType = FULFILLMENT_TYPE_DELIVERY,
  deliveryAddress
}: DeliveryInfoProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        {fulfillmentType === FULFILLMENT_TYPE_DELIVERY ? (
          <Truck className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Store className="h-4 w-4 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {fulfillmentType === FULFILLMENT_TYPE_DELIVERY ? 'Delivery' : 'Pickup'} Date: {format(new Date(deliveryDate), 'PPP')}
        </p>
      </div>
      
      {fulfillmentType === FULFILLMENT_TYPE_DELIVERY && deliveryAddress && (
        <p className="text-sm text-gray-600 mt-2 ml-6">
          Delivery Address: {deliveryAddress}
        </p>
      )}
    </div>
  );
}
