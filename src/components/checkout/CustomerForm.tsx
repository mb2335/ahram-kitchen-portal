import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerFormProps {
  fullName: string;
  email: string;
  phone: string;
  onFullNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CustomerForm({
  fullName,
  email,
  phone,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
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
        />
      </div>
    </div>
  );
}