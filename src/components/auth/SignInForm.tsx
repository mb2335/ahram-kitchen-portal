
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AuthFormField } from './AuthFormField';
import { useAuthForm } from '@/hooks/useAuthForm';

interface SignInFormProps {
  onToggleForm: () => void;
  onResetPassword: () => void;
}

export function SignInForm({ onToggleForm, onResetPassword }: SignInFormProps) {
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
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        disabled={isLoading}
      />

      <AuthFormField
        id="password"
        label="Password"
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
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onResetPassword}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}
