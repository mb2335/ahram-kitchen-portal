
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { AuthFormField } from './AuthFormField';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ResetPasswordForm() {
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

    if (!validatePassword(newPassword)) {
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now sign in with your new password.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Reset Your Password</h2>
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
