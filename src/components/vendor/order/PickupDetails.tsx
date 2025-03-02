
import { format, parseISO } from 'date-fns';
import { MapPin, Clock, Truck, Calendar } from 'lucide-react';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';

interface PickupDetailsProps {
  pickupDate: string;
  pickupTime?: string;
  pickupLocation?: string;
  fulfillmentType?: string;
  deliveryAddress?: string;
}

export function PickupDetails({ 
  pickupDate, 
  pickupTime, 
  pickupLocation, 
  fulfillmentType,
  deliveryAddress
}: PickupDetailsProps) {
  const isPickup = fulfillmentType === FULFILLMENT_TYPE_PICKUP;
  const isDelivery = fulfillmentType === FULFILLMENT_TYPE_DELIVERY;
  
  const date = new Date(pickupDate);
  
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-2">
        {isPickup ? 'Pickup Details' : isDelivery ? 'Delivery Details' : 'Order Details'}
      </h4>
      
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            {format(date, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        
        {isPickup && (
          <>
            {pickupTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{pickupTime}</span>
              </div>
            )}
            {pickupLocation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{pickupLocation}</span>
              </div>
            )}
          </>
        )}
        
        {isDelivery && (
          <>
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 mt-1" />
              <div>
                <div className="font-medium">Delivery Address:</div>
                <div className="whitespace-pre-line">
                  {deliveryAddress || "No address provided"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
