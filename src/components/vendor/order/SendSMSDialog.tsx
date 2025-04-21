
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
  orders?: Array<any>;
  categories?: Array<{ id: string; name: string }>;
  pickupLocations?: Array<string>;
  recipients?: Array<{ phone: string; name: string }>;
}

export function SendSMSDialog({ orders = [], categories = [], pickupLocations = [], recipients }: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    date: null as Date | null,
    categoryId: 'all',
    pickupLocation: 'all',
    fulfillmentType: 'all',
    status: 'all'
  });
  const { toast } = useToast();

  const filterOrders = (orders: any[]) => {
    return orders.filter(order => {
      if (filters.date) {
        const orderDate = new Date(order.delivery_date);
        if (orderDate.toDateString() !== filters.date.toDateString()) return false;
      }

      if (filters.categoryId && filters.categoryId !== 'all') {
        const hasCategory = order.order_items?.some((item: any) => 
          item.menu_item?.category?.id === filters.categoryId
        );
        if (!hasCategory) return false;
      }

      if (filters.fulfillmentType && filters.fulfillmentType !== 'all' && order.fulfillment_type !== filters.fulfillmentType) {
        return false;
      }

      if (filters.pickupLocation && filters.pickupLocation !== 'all' && order.pickup_location !== filters.pickupLocation) {
        return false;
      }

      if (filters.status && filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  const getRecipients = () => {
    if (recipients && recipients.length > 0) {
      return recipients;
    }
    
    const filteredOrders = filterOrders(orders);
    return filteredOrders
      .filter(order => order.customer?.phone)
      .map(order => ({
        phone: order.customer.phone,
        name: order.customer.full_name
      }));
  };

  const handleSendSMS = async () => {
    const finalRecipients = getRecipients();
    if (!message.trim() || finalRecipients.length === 0) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers: finalRecipients.map(r => r.phone),
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
        categoryId: 'all',
        pickupLocation: 'all',
        fulfillmentType: 'all',
        status: 'all'
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
  const buttonLabel = recipients?.length ? `Send SMS (${recipients.length})` : `Send SMS (${orders.length})`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send SMS</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {!recipients && (
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
                    <SelectItem value="all">All statuses</SelectItem>
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
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id || "unknown"} value={category.id || "unknown"}>
                        {category.name || "Unnamed category"}
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
                    <SelectItem value="all">All types</SelectItem>
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
                    <SelectItem value="all">All locations</SelectItem>
                    {pickupLocations.map((location) => (
                      <SelectItem key={location || "unknown-location"} value={location || "unknown-location"}>
                        {location || "Unspecified location"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
