import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'vendor' | 'customer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUserRole() {
      if (!session) {
        setIsAuthorized(false);
        return;
      }

      if (!requiredRole) {
        setIsAuthorized(true);
        return;
      }

      const { data: profile } = await supabase
        .from(requiredRole === 'vendor' ? 'vendors' : 'customers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      setIsAuthorized(!!profile);
    }

    checkUserRole();
  }, [session, requiredRole, supabase]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  if (!session || !isAuthorized) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}