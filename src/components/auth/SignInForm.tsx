
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AuthFormField } from './AuthFormField';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useState } from 'react';

interface SignInFormProps {
  onToggleForm: () => void;
  onResetPassword?: () => void;
}

export function SignInForm({ onToggleForm, onResetPassword }: SignInFormProps) {
  const [isResetMode, setIsResetMode] = useState(false);
  
  const {
    isLoading,
    formData,
    setFormData,
    handleSignIn,
    handlePasswordReset,
  } = useAuthForm(false);

  const toggleResetMode = () => {
    // If external handler is provided, use it instead of internal state
    if (onResetPassword && !isResetMode) {
      onResetPassword();
      return;
    }
    
    setIsResetMode(!isResetMode);
    // Clear any existing password data when toggling modes
    setFormData(prevData => ({
      ...prevData,
      password: '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isResetMode) {
      handlePasswordReset(e);
    } else {
      handleSignIn(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthFormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => setFormData({ ...formData, email: value })}
        required
        disabled={isLoading}
      />

      {!isResetMode && (
        <AuthFormField
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          required
          disabled={isLoading}
        />
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isResetMode ? 'Sending reset link...' : 'Signing in...'}
          </>
        ) : (
          isResetMode ? 'Send Password Reset Link' : 'Sign In'
        )}
      </Button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleResetMode}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          {isResetMode ? "Back to sign in" : "Forgot password?"}
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
