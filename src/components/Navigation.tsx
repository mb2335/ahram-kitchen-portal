import { Link } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, History, LogOut, Store, ShoppingCart, User, ChevronLeft } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const { items } = useCart();
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [isVendor, setIsVendor] = useState(false);
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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

  const NavigationLinks = () => (
    <>
      <Link to="/">
        <Button variant="ghost" size="sm" className="flex items-center">
          <MenuIcon className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {language === 'en' ? 'Menu' : '메뉴'}
          </span>
        </Button>
      </Link>

      {session && (
        <>
          <Link to="/orders">
            <Button variant="ghost" size="sm" className="flex items-center">
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Orders' : '주문'}
              </span>
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="flex items-center">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Profile' : '프로필'}
              </span>
            </Button>
          </Link>
        </>
      )}

      {isVendor && session && (
        <Link to="/vendor/summary">
          <Button variant="ghost" size="sm" className="flex items-center">
            <Store className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {language === 'en' ? 'Dashboard' : '대시보드'}
            </span>
          </Button>
        </Link>
      )}

      {session ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="flex items-center"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {language === 'en' ? 'Sign Out' : '로그아웃'}
          </span>
        </Button>
      ) : (
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="flex items-center">
            <User className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {language === 'en' ? 'Sign In' : '로그인'}
            </span>
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Language Toggle */}
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

          {/* Desktop Navigation Links */}
          <div className="hidden sm:flex items-center space-x-1">
            <NavigationLinks />
            <Link to="/cart">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-primary relative flex items-center"
              >
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Cart' : '장바구니'}
                </span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="sm:hidden flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[385px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Menu</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">ENG</span>
                      <Switch
                        checked={language === 'ko'}
                        onCheckedChange={toggleLanguage}
                      />
                      <span className="text-sm">KOR</span>
                    </div>
                  </div>
                  <NavigationLinks />
                  <Link to="/cart" className="w-full">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-primary w-full relative flex items-center justify-center"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      <span>
                        {language === 'en' ? 'Cart' : '장바구니'}
                      </span>
                      {cartItemCount > 0 && (
                        <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                          {cartItemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}