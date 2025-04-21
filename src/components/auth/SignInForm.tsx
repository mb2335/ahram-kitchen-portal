import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AuthFormField } from './AuthFormField';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useLanguage } from '@/hooks/useLanguage';

interface SignInFormProps {
  onToggleForm: () => void;
  onResetPassword: () => void;
}

export function SignInForm({ onToggleForm, onResetPassword }: SignInFormProps) {
  const { t } = useLanguage();
  const {
    isLoading,
    formData,
    setFormData,
    handleSignIn,
  } = useAuthForm(false);

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <AuthFormField
        id="email"
        label={t('auth.email')}
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        disabled={isLoading}
      />

      <AuthFormField
        id="password"
        label={t('auth.password')}
        type="password"
        value={formData.password}
        onChange={(value) => setFormData({ ...formData, password: value })}
        required
        disabled={isLoading}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('auth.signingIn')}
          </>
        ) : (
          t('auth.signin')
        )}
      </Button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResetPassword}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          {t('auth.forgot')}
        </button>
      </div>

      <p className="text-center text-sm text-gray-600">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline"
          disabled={isLoading}
        >
          {t('auth.signup')}
        </button>
      </p>
    </form>
  );
}
