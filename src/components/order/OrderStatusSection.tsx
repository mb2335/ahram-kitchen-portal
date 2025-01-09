import { format } from 'date-fns';
import { OrderStatusBadge } from '../shared/OrderStatusBadge';

interface OrderStatusSectionProps {
  id: string;
  status: string;
  createdAt: string;
  rejectionReason?: string;
}

export function OrderStatusSection({ id, status, createdAt, rejectionReason }: OrderStatusSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Order #{id.slice(0, 8)}</p>
          <p className="text-sm text-gray-500">
            {format(new Date(createdAt), 'PPP')}
          </p>
        </div>
        <OrderStatusBadge status={status} />
      </div>
      
      {rejectionReason && (
        <div className="mt-2">
          <p className="text-sm text-red-600">
            <span className="font-medium">Rejection Reason:</span> {rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
}