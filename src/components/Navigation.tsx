import { Link } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Menu, History, LogOut, Store, ShoppingCart, User, Languages } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useEffect, useState } from "react";

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
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold">
              Ahram Kitchen
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="flex items-center gap-2"
            >
              <Languages className="h-4 w-4" />
              {language === 'en' ? 'KO' : 'EN'}
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Menu' : '메뉴'}
              </Button>
            </Link>
            {session && (
              <>
                <Link to="/orders">
                  <Button variant="ghost" size="sm">
                    <History className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Order History' : '주문 내역'}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Profile' : '프로필'}
                  </Button>
                </Link>
              </>
            )}
            {isVendor && (
              <Link to="/vendor/summary">
                <Button variant="ghost" size="sm">
                  <Store className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
                </Button>
              </Link>
            )}
            {session ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Sign Out' : '로그아웃'}
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  {language === 'en' ? 'Sign In' : '로그인'}
                </Button>
              </Link>
            )}
            <Link to="/cart">
              <Button variant="default" size="sm" className="bg-primary">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Cart' : '장바구니'}
                {cartItemCount > 0 && (
                  <span className="ml-2 bg-white text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs">
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