import { useState, useEffect } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

type UserType = 'customer' | 'vendor';

interface FormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  businessName?: string;
}

export function Auth() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    businessName: '',
  });

  useEffect(() => {
    if (session) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo);
    }
  }, [session, navigate, location]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.fullName || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }

      if (userType === 'vendor' && !formData.businessName) {
        throw new Error('Business name is required for vendor accounts');
      }

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: userType,
            full_name: formData.fullName,
            phone: formData.phone,
            business_name: userType === 'vendor' ? formData.businessName : undefined,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email for verification.",
        });
        setIsSignUp(false);
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {location.state?.returnTo === '/checkout' 
              ? 'Sign in to Complete Your Order' 
              : isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          
          {isSignUp && (
            <div className="flex justify-center space-x-4 mb-6">
              <button
                type="button"
                className={`px-4 py-2 rounded transition-colors ${
                  userType === 'customer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100'
                }`}
                onClick={() => setUserType('customer')}
              >
                Customer
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded transition-colors ${
                  userType === 'vendor'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100'
                }`}
                onClick={() => setUserType('vendor')}
              >
                Vendor
              </button>
            </div>
          )}
        </div>

        {isSignUp ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="fullName">
                {userType === 'vendor' ? 'Contact Person Name' : 'Full Name'}
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            {userType === 'vendor' && (
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-primary hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  },
                  anchor: {
                    color: 'hsl(var(--primary))',
                  },
                },
              }}
              providers={[]}
              view="sign_in"
            />
            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-primary hover:underline"
              >
                Sign Up
              </button>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}