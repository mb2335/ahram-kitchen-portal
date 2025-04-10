
import { useState, useEffect } from 'react';
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
  const [hasValidSession, setHasValidSession] = useState(false);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    console.log("ResetPasswordForm mounted with recoveryToken:", recoveryToken ? "exists" : "missing");
    
    // Verify if we have a valid token for password reset
    const checkSession = async () => {
      if (!recoveryToken) {
        console.log("No recovery token provided");
        setHasValidSession(false);
        toast({
          title: 'Invalid Reset Link',
          description: 'This password reset link is invalid or has expired. Please request a new password reset.',
          variant: 'destructive',
        });
        if (onComplete) {
          setTimeout(() => onComplete(), 3000); // Go back to sign in after showing the message
        }
        return;
      }
      
      try {
        console.log("Setting auth session with recovery token");
        // This explicitly sets the auth session with the recovery token
        const { data, error } = await supabase.auth.setSession({
          access_token: recoveryToken,
          refresh_token: "",
        });
        
        if (error) {
          console.error("Error setting auth session:", error);
          throw error;
        }
        
        console.log("Auth session successfully set:", data);
        setHasValidSession(true);
      } catch (error) {
        console.error("Failed to set auth session:", error);
        setHasValidSession(false);
        toast({
          title: 'Invalid Reset Link',
          description: 'The password reset link is invalid or has expired. Please request a new password reset.',
          variant: 'destructive',
        });
        
        if (onComplete) {
          setTimeout(() => onComplete(), 3000); // Go back to sign in after showing the message
        }
      }
    };

    checkSession();
  }, [recoveryToken, toast, onComplete, supabase.auth]);

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

    if (!hasValidSession) {
      console.log("Attempted to reset password without a valid session");
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
    console.log("Attempting to reset password");

    try {
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
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidSession) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Invalid password reset link</p>
        <p className="text-sm text-gray-600">Please request a new password reset from the sign in page.</p>
      </div>
    );
  }

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
