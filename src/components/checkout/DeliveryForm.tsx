import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryFormProps {
  deliveryDate: Date;
  notes: string;
  onDateChange: (date: Date | undefined) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DeliveryForm({ deliveryDate, notes, onDateChange, onNotesChange }: DeliveryFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Delivery Date and Time</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deliveryDate ? format(deliveryDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deliveryDate}
              onSelect={onDateChange}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="notes">Special Instructions (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={onNotesChange}
          placeholder="Any special requests or dietary requirements?"
        />
      </div>
    </div>
  );
}