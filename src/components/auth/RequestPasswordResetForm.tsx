
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { AuthFormField } from './AuthFormField';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RequestPasswordResetFormProps {
  onCancel: () => void;
}

export function RequestPasswordResetForm({ onCancel }: RequestPasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/auth',
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists with this email, you'll receive instructions to reset your password.",
      });
      
      // Return to sign in form after sending the email
      onCancel();
      
    } catch (error: any) {
      console.error('Error during password reset request:', error);
      toast({
        title: "Error",
        description: "There was a problem sending the password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Reset Your Password</h2>
      <p className="text-sm text-gray-600 text-center mb-4">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      <AuthFormField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        disabled={isLoading}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send Password Reset Link'
        )}
      </Button>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          Back to sign in
        </button>
      </div>
    </form>
  );
}
