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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      {/* Order Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-600">
            Placed: {format(new Date(order.created_at || ''), 'PPP')}
          </p>
          <p className="text-sm text-gray-600">
            Delivery: {format(new Date(order.delivery_date), 'PPP')}
          </p>
        </div>
        <div className="text-right space-y-2">
          <p className="font-medium text-lg">${order.total_amount.toFixed(2)}</p>
          {getStatusBadge(order.status)}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium mb-2">Customer Details</h4>
        <div className="space-y-1">
          <p className="text-sm">Name: {order.customer?.full_name}</p>
          <p className="text-sm">Email: {order.customer?.email}</p>
          {order.customer?.phone && (
            <p className="text-sm">Phone: {order.customer.phone}</p>
          )}
        </div>
      </div>

      {/* Order Items Table */}
      <div>
        <h4 className="font-medium mb-2">Order Items</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.order_items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Summary */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>${(order.total_amount - order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span>${order.tax_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Additional Information */}
      {order.notes && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Order Notes</h4>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {order.rejection_reason && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2 text-red-600">Rejection Reason</h4>
          <p className="text-sm text-red-600">{order.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center border-t pt-4">
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