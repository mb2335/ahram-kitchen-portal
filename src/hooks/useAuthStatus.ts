import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function useAuthStatus() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [isVendor, setIsVendor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (session?.user) {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setIsVendor(!!vendor);
      } else {
        setIsVendor(false);
      }
    };

    checkVendorStatus();
  }, [session, supabase]);

  const handleSignOut = async () => {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (error.message.includes('session_not_found')) {
          console.log('Session already expired, proceeding with cleanup');
        } else {
          throw error;
        }
      }

      setIsVendor(false);
      window.location.href = '/';
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out properly. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  return { session, isVendor, handleSignOut };
}