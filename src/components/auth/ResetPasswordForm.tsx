
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { AuthFormField } from './AuthFormField';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ResetPasswordFormProps {
  onComplete?: () => void;
  recoveryToken?: string | null;
}

export function ResetPasswordForm({ onComplete, recoveryToken }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recoveryToken) {
      console.error("No recovery token available");
      toast({
        title: 'Invalid Session',
        description: 'Your password reset session is invalid. Please request a new password reset link.',
        variant: 'destructive',
      });
      if (onComplete) onComplete();
      return;
    }

    if (!validatePassword(newPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    console.log("Attempting to reset password with recovery token");

    try {
      // First set the session with the recovery token
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryToken,
        refresh_token: '',
      });

      if (sessionError) {
        console.error("Error setting session with recovery token:", sessionError);
        throw sessionError;
      }

      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      console.log("Password reset successful");
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now sign in with your new password.',
      });
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      } else {
        // Redirect to home page if no callback
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
      
      // Go back to sign in on error
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have a token before showing the form
  if (!recoveryToken) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Invalid password reset link</p>
        <p className="text-sm text-gray-600">Please request a new password reset from the sign in page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <p className="text-sm text-gray-600 text-center mb-4">
        Please enter your new password below.
      </p>

      <AuthFormField
        id="new-password"
        label="New Password"
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        required
        disabled={isLoading}
      />

      <AuthFormField
        id="confirm-password"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        disabled={isLoading}
      />

      {passwordError && (
        <p className="text-sm font-medium text-destructive">{passwordError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>
    </form>
  );
}
