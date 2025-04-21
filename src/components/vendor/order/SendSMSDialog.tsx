
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';

interface SendSMSDialogProps {
  orders: Array<any>;
  categories: Array<{ id: string; name: string }>;
  pickupLocations: Array<string>;
}

export function SendSMSDialog({ orders, categories, pickupLocations }: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    date: null as Date | null,
    categoryId: '',
    pickupLocation: '',
    fulfillmentType: '',
    status: ''
  });
  const { toast } = useToast();

  const filterOrders = (orders: any[]) => {
    return orders.filter(order => {
      if (filters.date) {
        const orderDate = new Date(order.delivery_date);
        if (orderDate.toDateString() !== filters.date.toDateString()) return false;
      }

      if (filters.categoryId) {
        const hasCategory = order.order_items?.some((item: any) => 
          item.menu_item?.category?.id === filters.categoryId
        );
        if (!hasCategory) return false;
      }

      if (filters.fulfillmentType && order.fulfillment_type !== filters.fulfillmentType) {
        return false;
      }

      if (filters.pickupLocation && order.pickup_location !== filters.pickupLocation) {
        return false;
      }

      if (filters.status && order.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  const getRecipients = () => {
    const filteredOrders = filterOrders(orders);
    return filteredOrders
      .filter(order => order.customer?.phone)
      .map(order => ({
        phone: order.customer.phone,
        name: order.customer.full_name
      }));
  };

  const handleSendSMS = async () => {
    const recipients = getRecipients();
    if (!message.trim() || recipients.length === 0) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers: recipients.map(r => r.phone),
          message: message.trim()
        }
      });

      if (error) throw error;

      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.filter((r: any) => !r.success).length;

      toast({
        title: 'SMS Notifications Sent',
        description: `Successfully sent to ${successCount} recipient${successCount !== 1 ? 's' : ''}${failCount > 0 ? `. Failed: ${failCount}` : ''}`,
        variant: failCount > 0 ? 'destructive' : 'default'
      });

      setOpen(false);
      setMessage('');
      setFilters({
        date: null,
        categoryId: '',
        pickupLocation: '',
        fulfillmentType: '',
        status: ''
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS notifications',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const recipientCount = getRecipients().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Send SMS ({orders.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send SMS</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                date={filters.date}
                onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fulfillment Type</Label>
              <Select
                value={filters.fulfillmentType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, fulfillmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value={FULFILLMENT_TYPE_PICKUP}>Pickup</SelectItem>
                  <SelectItem value={FULFILLMENT_TYPE_DELIVERY}>Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Select
                value={filters.pickupLocation}
                onValueChange={(value) => setFilters(prev => ({ ...prev, pickupLocation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {pickupLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Recipients: {recipientCount} customer{recipientCount !== 1 ? 's' : ''}
          </div>

          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            disabled={sending}
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSMS}
              disabled={sending || !message.trim() || recipientCount === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send SMS (${recipientCount})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
