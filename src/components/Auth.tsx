import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { SignInForm } from './auth/SignInForm';
import { SignUpForm } from './auth/SignUpForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { RequestPasswordResetForm } from './auth/RequestPasswordResetForm';
import { useToast } from './ui/use-toast';

// Define an interface for hash parameters
interface HashParams {
  [key: string]: string;
  type?: string;
  access_token?: string;
}

export function Auth() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const { toast } = useToast();
  const processedTokenRef = useRef(false);

  // Process URL hash parameters once
  useEffect(() => {
    if (processedTokenRef.current) return;

    const parseHashParams = (): HashParams => {
      // Get the hash without the leading # character
      const hash = window.location.hash.substring(1);
      console.log("Raw URL hash:", hash);
      
      const params: HashParams = {};
      
      if (hash) {
        hash.split('&').forEach(item => {
          const [key, value] = item.split('=');
          if (key) {
            params[key] = value !== undefined ? decodeURIComponent(value) : '';
          }
        });
      }
      
      console.log("Parsed hash parameters:", params);
      return params;
    };

    const hashParams = parseHashParams();
    const type = hashParams.type;
    const accessToken = hashParams.access_token;

    console.log("URL hash parameters:", { 
      type, 
      hasAccessToken: !!accessToken
    });

    if (type === 'recovery' && accessToken) {
      processedTokenRef.current = true;
      console.log("Password recovery flow detected with token:", accessToken);
      setIsResetPassword(true);
      setIsRequestingReset(false);
      setRecoveryToken(accessToken);
      
      // Clear the URL hash immediately but keep the recovery state in React
      // This prevents token leakage while maintaining the recovery flow
      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(
            {recoveryMode: true}, 
            document.title, 
            window.location.pathname + window.location.search
          );
        }
      } catch (e) {
        console.error("Error clearing URL hash:", e);
      }
      
      toast({
        title: "Password Reset",
        description: "Please enter your new password to complete the reset process.",
      });
    }
  }, [toast]);

  // Handle session changes separately from recovery flow
  useEffect(() => {
    // Skip redirect if we're handling a password reset
    if (isResetPassword || recoveryToken) {
      return;
    }

    if (session) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo);
    }
  }, [session, navigate, location, isResetPassword, recoveryToken]);

  // Handler for requesting a password reset (show the email form)
  const handleRequestPasswordReset = () => {
    setIsRequestingReset(true);
    setIsResetPassword(false);
  };

  // Handler for canceling the password reset request
  const handleCancelRequest = () => {
    setIsRequestingReset(false);
  };

  // Handle completion of password reset
  const handleResetComplete = () => {
    setIsResetPassword(false);
    setRecoveryToken(null);
    processedTokenRef.current = false; // Reset for potential future password resets
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {isResetPassword 
              ? 'Reset Your Password'
              : isRequestingReset
              ? 'Request Password Reset'
              : location.state?.returnTo === '/checkout' 
                ? 'Sign in to Complete Your Order' 
                : isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
        </div>

        {isResetPassword ? (
          <ResetPasswordForm 
            onComplete={handleResetComplete} 
            recoveryToken={recoveryToken}
          />
        ) : isRequestingReset ? (
          <RequestPasswordResetForm onCancel={handleCancelRequest} />
        ) : isSignUp ? (
          <SignUpForm onToggleForm={() => setIsSignUp(false)} />
        ) : (
          <SignInForm 
            onToggleForm={() => setIsSignUp(true)} 
            onResetPassword={handleRequestPasswordReset} 
          />
        )}
      </Card>
    </div>
  );
}
