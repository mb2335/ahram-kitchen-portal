import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Order {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  total_amount: number;
  tax_amount: number;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  customer: {
    full_name: string;
    email: string;
    phone?: string;
  };
  order_items: Array<{
    quantity: number;
    unit_price: number;
    menu_item: {
      name: string;
    };
  }>;
}

export function OrderManagement() {
  const session = useSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorData) {
        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(full_name, email, phone),
            order_items(
              quantity,
              unit_price,
              menu_item:menu_items(name)
            )
          `)
          .order('created_at', { ascending: false });
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          rejection_reason: status === 'rejected' ? statusNote : null,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Order status updated to ${status}`,
      });

      setStatusNote('');
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order Management</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                  <Badge variant={
                    order.status === 'completed' ? 'default' :
                    order.status === 'processing' ? 'secondary' :
                    order.status === 'rejected' ? 'destructive' : 'outline'
                  }>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Customer: {order.customer?.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  Contact: {order.customer?.email} {order.customer?.phone && `/ ${order.customer.phone}`}
                </p>
                <div className="mt-2 space-y-1">
                  {order.order_items.map((item, index) => (
                    <p key={index} className="text-sm">
                      {item.quantity}x {item.menu_item?.name} - ${item.unit_price}
                    </p>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-sm">Tax: ${order.tax_amount}</p>
                  <p className="font-semibold">Total: ${order.total_amount}</p>
                </div>
                {order.notes && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">Customer Notes:</p>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                    >
                      Accept
                    </Button>
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for rejection"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </>
                )}
                {order.status === 'processing' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}