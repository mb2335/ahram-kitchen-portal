import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Order } from './types';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch all orders with customer details and order items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email, phone),
          order_items(id, menu_item_id, quantity, unit_price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched orders:', data);
      setOrders(data as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error fetching orders',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status'], reason?: string) => {
    try {
      console.log(`Updating order ${orderId} to status: ${status}`);
      const updateData: any = { status };
      if (reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order ${status} successfully`,
      });

      // Refresh orders list after update
      fetchOrders();
      setSelectedOrderId(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error updating order status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm">
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

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button 
                  variant="outline"
                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                >
                  Mark as Confirmed
                </Button>
              )}
              {order.status === 'confirmed' && (
                <Button 
                  variant="outline"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                >
                  Mark as Completed
                </Button>
              )}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      Reject Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (selectedOrderId) {
                            updateOrderStatus(selectedOrderId, 'rejected', rejectionReason);
                          }
                        }}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {order.rejection_reason && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-red-600">
                  <span className="font-medium">Rejection Reason:</span> {order.rejection_reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}