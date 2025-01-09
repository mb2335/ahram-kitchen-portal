import { format } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';

interface DeliveryInfoProps {
  deliveryDate: string;
  pickupTime?: string;
  pickupLocation?: string;
}

export function DeliveryInfo({ deliveryDate, pickupTime, pickupLocation }: DeliveryInfoProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Delivery Date:</span>{' '}
          {format(new Date(deliveryDate), 'PPP')}
        </p>
        
        {pickupTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Pickup Time: {pickupTime}</span>
          </div>
        )}
        
        {pickupLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Pickup Location: {pickupLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
}