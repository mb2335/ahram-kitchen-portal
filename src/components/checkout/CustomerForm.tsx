
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomerFormProps {
  fullName: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSmsOptInChange: (checked: boolean) => void;
  isReadOnly?: boolean;
}

export function CustomerForm({
  fullName,
  email,
  phone,
  smsOptIn,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onSmsOptInChange,
  isReadOnly = false,
}: CustomerFormProps) {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">{t('checkout.customer.info')}</h3>
      <div>
        <Label htmlFor="fullName">{t('checkout.customer.fullName')}</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={onFullNameChange}
          required
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-gray-100" : ""}
        />
      </div>

      <div>
        <Label htmlFor="email">{t('checkout.customer.email')}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={onEmailChange}
          required
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-gray-100" : ""}
        />
      </div>

      <div>
        <Label htmlFor="phone">{t('checkout.customer.phone')}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={onPhoneChange}
          required
          readOnly={isReadOnly}
          className={isReadOnly ? "bg-gray-100" : ""}
        />
      </div>

      {!isReadOnly && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sms-opt-in" 
            checked={smsOptIn} 
            onCheckedChange={onSmsOptInChange} 
            required
          />
          <Label htmlFor="sms-opt-in" className="text-sm font-medium">
            I agree to receive SMS updates about my order. This is required to place an order.
          </Label>
        </div>
      )}
    </div>
  );
}
