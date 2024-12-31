import { format } from 'date-fns';
import { OrderStatusBadge } from '../shared/OrderStatusBadge';

interface OrderStatusSectionProps {
  id: string;
  status: string;
  createdAt: string;
}

export function OrderStatusSection({ id, status, createdAt }: OrderStatusSectionProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm text-gray-500">Order #{id.slice(0, 8)}</p>
        <p className="text-sm text-gray-500">
          {format(new Date(createdAt), 'PPP')}
        </p>
      </div>
      <OrderStatusBadge status={status} />
    </div>
  );
}