import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';

export function Auth() {
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    businessName: '',
  });

  if (session) {
    navigate('/');
    return null;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
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

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex justify-center space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded ${
                userType === 'customer'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100'
              }`}
              onClick={() => setUserType('customer')}
            >
              Customer
            </button>
            <button
              className={`px-4 py-2 rounded ${
                userType === 'vendor'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100'
              }`}
              onClick={() => setUserType('vendor')}
            >
              Vendor
            </button>
          </div>
        </div>

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
            <Label htmlFor="fullName">{userType === 'vendor' ? 'Contact Person Name' : 'Full Name'}</Label>
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

          <Button type="submit" className="w-full">Sign Up</Button>
        </form>

        <div className="mt-4">
          <p className="text-center text-sm text-gray-600">
            Already have an account?
          </p>
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            view="sign_in"
          />
        </div>
      </Card>
    </div>
  );
}