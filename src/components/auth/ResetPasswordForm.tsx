
import { useState, useEffect, useRef } from 'react';
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
  const [isValidating, setIsValidating] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const validationAttemptedRef = useRef(false);

  // Initialize session with the recovery token
  useEffect(() => {
    console.log("ResetPasswordForm mounted with recoveryToken:", recoveryToken ? "exists" : "missing");
    
    const initializeSession = async () => {
      // Only run once to prevent infinite loops
      if (validationAttemptedRef.current) return;
      validationAttemptedRef.current = true;
      
      if (!recoveryToken) {
        setTokenValid(false);
        setIsValidating(false);
        console.log("No recovery token found");
        return;
      }

      try {
        setIsValidating(true);
        console.log("Initializing session with recovery token");
        
        // Basic token validation
        if (typeof recoveryToken !== 'string' || recoveryToken.length < 10) {
          throw new Error("Invalid token format");
        }

        // Instead of trying to set the session (which might be failing),
        // let's verify the token directly
        const { error } = await supabase.auth.verifyOtp({
          token_hash: recoveryToken,
          type: 'recovery',
        });
        
        if (error) {
          console.error("Token verification error:", error);
          throw error;
        }
        
        console.log("Token verification successful");
        setTokenValid(true);
        setIsValidating(false);
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
        setIsValidating(false);
        
        toast({
          title: "Invalid Recovery Link",
          description: "The password reset link is invalid or has expired. Please request a new password reset.",
          variant: 'destructive',
        });
        
        // Redirect back to sign in after showing error
        if (onComplete) {
          setTimeout(onComplete, 2000);
        }
      }
    };

    initializeSession();
  }, [recoveryToken, toast, onComplete, supabase]);

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

    if (!recoveryToken || !tokenValid) {
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
      // Use the correct method for updating password with OTP
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      console.log("Password reset successful", data);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now sign in with your new password.',
      });
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
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

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-gray-600">Validating your reset link...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Invalid or expired password reset link</p>
        <p className="text-sm text-gray-600 mb-4">Please request a new password reset from the sign in page.</p>
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
