import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { SignInForm } from './auth/SignInForm';
import { SignUpForm } from './auth/SignUpForm';

export function Auth() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (session) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo);
    }
  }, [session, navigate, location]);

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {location.state?.returnTo === '/checkout' 
              ? 'Sign in to Complete Your Order' 
              : isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
        </div>

        {isSignUp ? (
          <SignUpForm onToggleForm={() => setIsSignUp(false)} />
        ) : (
          <SignInForm onToggleForm={() => setIsSignUp(true)} />
        )}
      </Card>
    </div>
  );
}