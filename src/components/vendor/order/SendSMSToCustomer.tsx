
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface SendSMSToCustomerProps {
  customerPhone: string;
  customerName: string;
}

export function SendSMSToCustomer({ customerPhone, customerName }: SendSMSToCustomerProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendSMS = async () => {
    if (!message.trim() || !customerPhone) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers: [customerPhone],
          message: message.trim()
        }
      });

      if (error) {
        console.error('Error invoking edge function:', error);
        throw new Error(error.message || 'Failed to send SMS notification');
      }

      toast({
        title: 'SMS Notification Sent',
        description: `Message sent to ${customerName}`,
      });

      setOpen(false);
      setMessage('');
    } catch (error: any) {
      console.error('SMS sending error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send SMS notification',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={!customerPhone}
        >
          <MessageSquare className="h-4 w-4" />
          Send SMS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send SMS to {customerName}</DialogTitle>
          <DialogDescription>
            Send a direct SMS notification to this customer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
              disabled={sending || !message.trim() || !customerPhone}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send SMS'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
