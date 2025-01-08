import { format } from 'date-fns';

interface PickupDetailsProps {
  pickupDate: string;
  pickupLocation?: string;
}

export function PickupDetails({ pickupDate, pickupLocation }: PickupDetailsProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-medium mb-2">Pickup Details</h4>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Date:</span>{' '}
          {format(new Date(pickupDate), 'PPP')}
        </p>
        {pickupLocation && (
          <p>
            <span className="font-medium">Location:</span>{' '}
            {pickupLocation}
          </p>
        )}
      </div>
    </div>
  );
}