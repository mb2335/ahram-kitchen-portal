
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface SendSMSDialogProps {
  recipients: Array<{
    phone: string;
    name: string;
  }>;
}

export function SendSMSDialog({ recipients }: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendSMS = async () => {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={recipients.length === 0}>
          Send SMS ({recipients.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="text-sm text-gray-500">
            Recipients: {recipients.map(r => r.name).join(', ')}
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
                'Send SMS'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
