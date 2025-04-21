
import { useState, useEffect } from 'react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrderFilters } from './OrderFilters';

interface Recipient {
  phone: string;
  name: string;
}

export interface SendSMSDialogProps {
  orders?: Array<any>;
  recipients?: Array<Recipient>;
  categories?: Array<{ id: string; name: string }>;
  pickupLocations?: Array<string>;
  currentFilters?: OrderFilters;
}

export function SendSMSDialog({ 
  orders = [], 
  recipients: initialRecipients,
  categories = [], 
  pickupLocations = [],
  currentFilters
}: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    date: currentFilters?.date || null as Date | null,
    categoryId: currentFilters?.categoryId || 'all',
    pickupLocation: currentFilters?.pickupLocation || 'all',
    fulfillmentType: currentFilters?.fulfillmentType || 'all',
    status: 'all'
  });
  const { toast } = useToast();

  // Update filters when currentFilters change
  useEffect(() => {
    if (currentFilters) {
      setFilters(prev => ({
        ...prev,
        date: currentFilters.date || null,
        categoryId: currentFilters.categoryId || 'all',
        pickupLocation: currentFilters.pickupLocation || 'all',
        fulfillmentType: currentFilters.fulfillmentType || 'all'
      }));
    }
  }, [currentFilters]);

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

      if (filters.pickupLocation && filters.pickupLocation !== 'all') {
        if (order.fulfillment_type !== FULFILLMENT_TYPE_PICKUP) return false;
        if (order.pickup_location !== filters.pickupLocation) return false;
      }

      if (filters.status && filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  const getRecipients = () => {
    // If we have direct recipients passed, use those
    if (initialRecipients && initialRecipients.length > 0) {
      return initialRecipients;
    }
    
    // Otherwise extract recipients from filtered orders
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

      if (error) {
        console.error('Error invoking edge function:', error);
        throw new Error(error.message || 'Failed to send SMS notifications');
      }

      if (!data || !data.results) {
        throw new Error('Invalid response from server');
      }

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
      console.error('SMS sending error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS notifications',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const recipients = getRecipients();
  const buttonLabel = `Send SMS (${recipients.length})`;

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
          <DialogDescription>
            Send SMS notifications to customers based on your filters or selected recipients.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {!initialRecipients && (
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
                      <SelectItem key={category.id || "unknown-category"} value={category.id || "unknown-category"}>
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

          <div className="space-y-2">
            <Label>Recipients ({recipients.length})</Label>
            <ScrollArea className="h-[100px] w-full rounded-md border p-2">
              {recipients.length > 0 ? (
                recipients.map((recipient, index) => (
                  <div key={index} className="py-1">
                    {recipient.name} ({recipient.phone})
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No recipients match the selected filters
                </div>
              )}
            </ScrollArea>
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
              disabled={sending || !message.trim() || recipients.length === 0}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send SMS (${recipients.length})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
