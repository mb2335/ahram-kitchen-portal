import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Link } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { MobileNavigation } from "./navigation/MobileNavigation";
import { DesktopNavigation } from "./navigation/DesktopNavigation";

export function Navigation() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [isVendor, setIsVendor] = useState(false);

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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
              Ahram Kitchen
            </Link>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm text-gray-600">ENG</span>
              <Switch
                checked={language === 'ko'}
                onCheckedChange={toggleLanguage}
              />
              <span className="text-sm text-gray-600">KOR</span>
            </div>
          </div>

          <DesktopNavigation 
            isVendor={isVendor}
            session={session}
            handleSignOut={handleSignOut}
          />
          
          <MobileNavigation 
            isVendor={isVendor}
            session={session}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </nav>
  );
}