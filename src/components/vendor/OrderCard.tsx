import { Order } from './types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderCardProps {
  order: Order;
  onDelete?: (orderId: string) => void;
  children?: React.ReactNode;
}

export function OrderCard({ order, onDelete, children }: OrderCardProps) {
  const { language } = useLanguage();
  
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
          <p className="text-sm text-gray-600 mt-2">
            Placed on: {format(new Date(order.created_at || ''), 'PPP')}
          </p>
          <p className="text-sm text-gray-600">
            Delivery on: {format(new Date(order.delivery_date), 'PPP')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">${order.total_amount.toFixed(2)}</p>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="font-medium text-sm">Order Items:</p>
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.quantity}x {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}</span>
            <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {order.notes}
          </p>
        </div>
      )}

      {order.rejection_reason && (
        <div className="mb-4">
          <p className="text-sm text-red-600">
            <span className="font-medium">Rejection Reason:</span> {order.rejection_reason}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {children}
        </div>
        
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete Order</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the order
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(order.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}