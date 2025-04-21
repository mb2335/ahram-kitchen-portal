import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AuthFormField } from './AuthFormField';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useLanguage } from '@/hooks/useLanguage';

interface SignUpFormProps {
  onToggleForm: () => void;
}

export function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const { t } = useLanguage();
  const {
    isLoading,
    formData,
    passwordError,
    setFormData,
    validatePassword,
    handleSignUp,
  } = useAuthForm(true);

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <AuthFormField
        id="fullName"
        label={t('auth.fullName')}
        value={formData.fullName || ''}
        onChange={(value) => setFormData({ ...formData, fullName: value })}
        required
        disabled={isLoading}
      />

      <AuthFormField
        id="email"
        label={t('auth.email')}
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        disabled={isLoading}
      />

      <div>
        <AuthFormField
          id="password"
          label={t('auth.password')}
          type="password"
          value={formData.password}
          onChange={(value) => {
            setFormData({ ...formData, password: value });
            validatePassword(value);
          }}
          required
          disabled={isLoading}
        />
        {passwordError && (
          <p className="text-sm text-red-500 mt-1">{passwordError}</p>
        )}
      </div>

      <AuthFormField
        id="phone"
        label={t('auth.phone')}
        type="tel"
        value={formData.phone || ''}
        onChange={(value) => setFormData({ ...formData, phone: value })}
        required
        disabled={isLoading}
      />

      <Button type="submit" className="w-full" disabled={isLoading || !!passwordError}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.processing')}
          </>
        ) : (
          t('auth.signup')
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        {t('auth.hasAccount')}{' '}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline"
          disabled={isLoading}
        >
          {t('auth.signin')}
        </button>
      </p>
    </form>
  );
}
