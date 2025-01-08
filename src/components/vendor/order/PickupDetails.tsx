import { format } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';

interface PickupDetailsProps {
  pickupDate: string;
  pickupLocation?: string;
  pickupDetails?: {
    time: string;
    location: string;
  };
}

export function PickupDetails({ pickupDate, pickupLocation, pickupDetails }: PickupDetailsProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-2">Pickup Details</h4>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Date:</span>{' '}
          {format(new Date(pickupDate), 'PPP')}
        </p>
        {pickupDetails ? (
          <>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{pickupDetails.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{pickupDetails.location}</span>
            </div>
          </>
        ) : pickupLocation ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{pickupLocation}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}