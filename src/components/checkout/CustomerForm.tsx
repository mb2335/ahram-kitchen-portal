
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  isPreviouslyOptedIn?: boolean;
  showSmsWarning?: boolean;
  showOptInCheckbox?: boolean; // New prop to explicitly control checkbox visibility
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
  isPreviouslyOptedIn = false,
  showSmsWarning = false,
  showOptInCheckbox, // Default undefined means we'll use the legacy behavior
}: CustomerFormProps) {
  const { t } = useLanguage();
  const [showOptIn, setShowOptIn] = useState(true);
  
  // Calculate whether to show the opt-in checkbox
  useEffect(() => {
    // If showOptInCheckbox is explicitly provided, use it
    if (showOptInCheckbox !== undefined) {
      setShowOptIn(showOptInCheckbox);
      return;
    }
    
    // Legacy behavior: hide checkbox if previously opted in
    if (isPreviouslyOptedIn) {
      setShowOptIn(false);
      // Make sure smsOptIn is true if they previously opted in
      if (!smsOptIn) {
        onSmsOptInChange(true);
      }
    } else {
      setShowOptIn(true);
    }
  }, [isPreviouslyOptedIn, smsOptIn, onSmsOptInChange, showOptInCheckbox]);

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

      {!isReadOnly && showOptIn && (
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

      {isPreviouslyOptedIn && !showOptIn && (
        <div className="text-sm text-muted-foreground">
          You have previously opted in to receive SMS updates.
        </div>
      )}

      {showSmsWarning && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>SMS Opt-in Required</AlertTitle>
          <AlertDescription>
            You must agree to receive SMS updates to place an order. This allows us to send you important updates about your order status.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
