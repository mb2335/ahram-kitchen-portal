import { useState } from 'react';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';

export function Auth() {
  const session = useSession();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');

  if (session) {
    navigate('/');
    return null;
  }

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
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={window.location.origin}
          view="sign_up"
          additionalData={{
            user_type: userType,
          }}
        />
      </Card>
    </div>
  );
}