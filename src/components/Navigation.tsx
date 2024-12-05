import { Link } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, History, LogOut, Store, ShoppingCart, User } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

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
          .single();
        
        setIsVendor(!!vendor);
      }
    };

    checkVendorStatus();
  }, [session, supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
              Ahram Kitchen
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">ENG</span>
              <Switch
                checked={language === 'ko'}
                onCheckedChange={toggleLanguage}
              />
              <span className="text-sm text-gray-600">KOR</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <MenuIcon className="h-5 w-5 mr-2" />
                {language === 'en' ? 'Menu' : '메뉴'}
              </Button>
            </Link>
            {session && (
              <>
                <Link to="/orders">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <History className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Order History' : '주문 내역'}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <User className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Profile' : '프로필'}
                  </Button>
                </Link>
              </>
            )}
            {isVendor && (
              <Link to="/vendor/summary">
                <Button variant="ghost" size="sm">
                  <Store className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">
                    {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
                  </span>
                </Button>
              </Link>
            )}
            {session ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">
                  {language === 'en' ? 'Sign Out' : '로그아웃'}
                </span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {language === 'en' ? 'Sign In' : '로그인'}
                </Button>
              </Link>
            )}
            <Link to="/cart">
              <Button variant="default" size="sm" className="bg-primary relative">
                <ShoppingCart className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">
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
        </div>
      </div>
    </nav>
  );
}