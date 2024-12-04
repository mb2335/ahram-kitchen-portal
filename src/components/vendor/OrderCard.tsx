import { Order } from './types';
import { Badge } from '@/components/ui/badge';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
}

export function OrderCard({ order, children }: OrderCardProps) {
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
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">{order.customer?.full_name}</p>
          <p className="text-sm text-gray-600">{order.customer?.email}</p>
          {order.customer?.phone && (
            <p className="text-sm text-gray-600">{order.customer.phone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-medium">${order.total_amount.toFixed(2)}</p>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {order.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {order.notes}
          </p>
        </div>
      )}

      {children}

      {order.rejection_reason && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-red-600">
            <span className="font-medium">Rejection Reason:</span> {order.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
}