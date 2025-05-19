
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Order } from '../types';
import { formatCurrency } from '@/utils/formatters';

interface OrderHeaderProps {
  order: Order;
}

export function OrderHeader({ order }: OrderHeaderProps) {
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
        <p className="text-sm text-gray-600">
          Placed: {format(new Date(order.created_at || ''), 'PPP')}
        </p>
        <p className="text-sm text-gray-600">
          Pickup: {format(new Date(order.delivery_date), 'PPP')}
        </p>
      </div>
      <div className="text-right space-y-2">
        <p className="font-medium text-lg">{formatCurrency(order.total_amount)}</p>
        {getStatusBadge(order.status)}
      </div>
    </div>
  );
}
