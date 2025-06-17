
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarDays, MapPin, FileText } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DeliveryFormProps {
  deliveryDate: Date;
  notes: string;
  onDateChange: (date: Date) => void;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
}

export function DeliveryForm({
  deliveryDate,
  notes,
  onDateChange,
  onNotesChange,
  fulfillmentType,
  deliveryAddress,
  onDeliveryAddressChange,
}: DeliveryFormProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {fulfillmentType === 'delivery' ? t('delivery.date') : t('pickup.date')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="delivery-date">
              {fulfillmentType === 'delivery' ? 'Delivery Date' : 'Pickup Date'}
            </Label>
            <DatePicker
              selected={deliveryDate}
              onSelect={(date) => date && onDateChange(date)}
              minDate={new Date()}
            />
          </div>
        </CardContent>
      </Card>

      {fulfillmentType === 'delivery' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t('delivery.address')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="delivery-address">Delivery Address *</Label>
              <Input
                id="delivery-address"
                value={deliveryAddress}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                placeholder="Enter your full delivery address"
                required
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('order.notes')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={onNotesChange}
              placeholder="Any special instructions for your order..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
