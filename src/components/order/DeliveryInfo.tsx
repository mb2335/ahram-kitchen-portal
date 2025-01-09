import { format } from 'date-fns';

interface DeliveryInfoProps {
  deliveryDate: string;
}

export function DeliveryInfo({ deliveryDate }: DeliveryInfoProps) {
  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm text-gray-600">
        <span className="font-medium">Delivery Date:</span>{' '}
        {format(new Date(deliveryDate), 'PPP')}
      </p>
    </div>
  );
}