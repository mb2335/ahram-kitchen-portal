
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeliveryNotesProps {
  notes: string;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function DeliveryNotes({ notes, onNotesChange }: DeliveryNotesProps) {
  const { t } = useLanguage();
  
  return (
    <div>
      <Label htmlFor="notes">{t('checkout.notes')}</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={onNotesChange}
        placeholder={t('checkout.notes.placeholder')}
      />
    </div>
  );
}
