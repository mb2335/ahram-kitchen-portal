
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { SignInForm } from './auth/SignInForm';
import { SignUpForm } from './auth/SignUpForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { useToast } from './ui/use-toast';

export function Auth() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for password reset tokens in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      // Handle password recovery flow
      setIsResetPassword(true);
      toast({
        title: "Password Reset",
        description: "Please enter your new password to complete the reset process.",
      });
    }
    
    if (session) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo);
    }
  }, [session, navigate, location, toast]);

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {isResetPassword 
              ? 'Reset Your Password'
              : location.state?.returnTo === '/checkout' 
                ? 'Sign in to Complete Your Order' 
                : isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
        </div>

        {isResetPassword ? (
          <ResetPasswordForm />
        ) : isSignUp ? (
          <SignUpForm onToggleForm={() => setIsSignUp(false)} />
        ) : (
          <SignInForm onToggleForm={() => setIsSignUp(true)} />
        )}
      </Card>
    </div>
  );
}
