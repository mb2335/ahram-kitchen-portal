import { format } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';

interface PickupDetailsProps {
  pickupDate: string;
  pickupTime?: string;
  pickupLocation?: string;
}

export function PickupDetails({ pickupDate, pickupTime, pickupLocation }: PickupDetailsProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-2">Pickup Details</h4>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Date:</span>{' '}
          {format(new Date(pickupDate), 'PPP')}
        </p>
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
      </div>
    </div>
  );
}