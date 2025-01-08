import { format } from 'date-fns';

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
            <p>
              <span className="font-medium">Time:</span>{' '}
              {pickupDetails.time}
            </p>
            <p>
              <span className="font-medium">Location:</span>{' '}
              {pickupDetails.location}
            </p>
          </>
        ) : pickupLocation ? (
          <p>
            <span className="font-medium">Location:</span>{' '}
            {pickupLocation}
          </p>
        ) : null}
      </div>
    </div>
  );
}