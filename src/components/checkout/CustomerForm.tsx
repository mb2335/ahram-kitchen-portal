import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
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
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="phone">Phone Number</Label>
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