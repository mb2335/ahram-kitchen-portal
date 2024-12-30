import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "./ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavigationLinks } from "./navigation/NavigationLinks";
import { LanguageToggle } from "./navigation/LanguageToggle";
import { CartButton } from "./navigation/CartButton";

export function Navigation() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { toast } = useToast();
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

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Language Toggle */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors whitespace-nowrap">
              Ahram Kitchen
            </Link>
            <div className="hidden md:block">
              <LanguageToggle />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 px-4">
            <NavigationLinks isVendor={isVendor} onSignOut={handleSignOut} />
          </div>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-2">
            <CartButton />

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <div className="flex items-center justify-center mb-6">
                      <LanguageToggle />
                    </div>
                    <NavigationLinks isVendor={isVendor} onSignOut={handleSignOut} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}