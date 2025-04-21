
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { SignInForm } from './auth/SignInForm';
import { SignUpForm } from './auth/SignUpForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { RequestPasswordResetForm } from './auth/RequestPasswordResetForm';
import { useToast } from './ui/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();

  // Process URL hash parameters once
  useEffect(() => {
    if (processedTokenRef.current) {
      console.log("Token already processed, skipping");
      return;
    }

    // Parse hash parameters more reliably
    const parseHashParams = (): HashParams => {
      const hash = window.location.hash.substring(1);
      console.log("Raw URL hash:", hash);
      
      // Skip if there's no hash
      if (!hash) return { type: '', access_token: '' };
      
      const params: HashParams = {};
      
      // Split by & and then by = to get key-value pairs
      hash.split('&').forEach(item => {
        if (!item) return;
        
        const parts = item.split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          // Join the rest with = in case the value itself contains =
          const value = parts.slice(1).join('=');
          if (key) {
            params[key] = decodeURIComponent(value);
          }
        }
      });
      
      console.log("Parsed hash parameters:", params);
      return params;
    };

    const hashParams = parseHashParams();
    
    // Check for recovery flow
    if (hashParams.type === 'recovery' && hashParams.access_token) {
      processedTokenRef.current = true;
      console.log("Password recovery flow detected with token:", hashParams.access_token);
      
      // Set up the recovery UI state
      setIsResetPassword(true);
      setIsRequestingReset(false);
      setRecoveryToken(hashParams.access_token);
      
      // Clear the URL hash to prevent token leakage
      try {
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(
            {recoveryMode: true, token: hashParams.access_token}, 
            document.title, 
            cleanUrl
          );
          console.log("URL hash cleared", cleanUrl);
        } else {
          console.warn("History API not available, couldn't clear URL hash");
        }
      } catch (e) {
        console.error("Error clearing URL hash:", e);
      }
      
      toast({
        title: "Password Reset",
        description: "Please enter your new password to complete the reset process.",
      });
    } else {
      console.log("No recovery parameters found in URL hash");
    }
  }, [toast]);

  // Handle session changes separately from recovery flow
  useEffect(() => {
    // Skip redirect if we're handling a password reset
    if (isResetPassword || recoveryToken) {
      console.log("Skipping redirect due to password reset flow");
      return;
    }

    if (session) {
      const returnTo = location.state?.returnTo || '/';
      console.log("Session detected, navigating to:", returnTo);
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
    console.log("Reset password completed, returning to sign in");
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
              ? t('auth.reset')
              : isRequestingReset
              ? t('auth.request')
              : location.state?.returnTo === '/checkout' 
                ? t('auth.checkout')
                : isSignUp ? t('auth.signup') : t('auth.signin')}
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
