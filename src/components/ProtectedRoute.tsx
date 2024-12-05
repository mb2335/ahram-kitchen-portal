import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useToast } from './ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'vendor' | 'customer';
}

const AUTHORIZED_VENDOR_EMAILS = ['mjbutler.35@gmail.com', 'apnosh@gmail.com'];

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { toast } = useToast();

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

      try {
        // Check if user has the required role
        const { data: profile, error } = await supabase
          .from(requiredRole === 'vendor' ? 'vendors' : 'customers')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;

        // Additional email check for vendor role
        if (requiredRole === 'vendor' && !AUTHORIZED_VENDOR_EMAILS.includes(session.user.email || '')) {
          setIsAuthorized(false);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the vendor dashboard.",
            variant: "destructive",
          });
          return;
        }
        
        setIsAuthorized(!!profile);
        
        if (!profile) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this area.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAuthorized(false);
      }
    }

    checkUserRole();
  }, [session, requiredRole, supabase, toast]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  if (!session || !isAuthorized) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}