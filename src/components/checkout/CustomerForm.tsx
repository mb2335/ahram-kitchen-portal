
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface CustomerFormProps {
  fullName: string;
  email: string;
  phone: string;
  onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isReadOnly?: boolean;
}

export function CustomerForm({
  fullName,
  email,
  phone,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
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
    </div>
  );
}
