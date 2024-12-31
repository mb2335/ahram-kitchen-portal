import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DeliveryNotesProps {
  notes: string;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DeliveryNotes({ notes, onNotesChange }: DeliveryNotesProps) {
  return (
    <div>
      <Label htmlFor="notes">Special Instructions (Optional)</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={onNotesChange}
        placeholder="Any special requests or dietary requirements?"
      />
    </div>
  );
}