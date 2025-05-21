
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/components/vendor/types';

interface SendSMSDialogProps {
  orders: Order[];
  pickupLocations: string[];
}

export function SendSMSDialog({ orders, pickupLocations }: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extract unique phone numbers from orders
      const phoneNumbers = Array.from(
        new Set(
          orders
            .map(order => order.customer?.phone || order.customer_phone)
            .filter(Boolean)
        )
      );

      if (phoneNumbers.length === 0) {
        throw new Error('No valid phone numbers found');
      }

      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers,
          message: `Ahram Kitchen: ${message}`
        }
      });

      if (error) throw error;

      toast({
        title: 'SMS Sent Successfully',
        description: `Message sent to ${phoneNumbers.length} customer(s)`,
      });
      
      setOpen(false);
      setMessage('');
    } catch (error: any) {
      toast({
        title: 'Failed to Send SMS',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <MessageSquare className="mr-2 h-4 w-4" />
        Send SMS to Customers
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send SMS to Customers</DialogTitle>
          </DialogHeader>
          
          <div className="my-6 space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm mb-1">
                Message will be sent to {orders.filter(order => order.customer?.phone || order.customer_phone).length} customer(s)
              </p>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendSMS}
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
