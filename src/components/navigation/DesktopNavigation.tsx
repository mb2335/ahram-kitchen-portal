import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, History, LogOut, Store, ShoppingCart, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { InstallPWA } from "@/components/shared/InstallPWA";

interface DesktopNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => Promise<void>;
}

export function DesktopNavigation({ isVendor, session, handleSignOut }: DesktopNavigationProps) {
  const { language } = useLanguage();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="hidden sm:flex items-center space-x-1">
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
                {language === 'en' ? 'Order History' : '주문 내역'}
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
              {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
            </span>
          </Button>
        </Link>
      )}

      <InstallPWA />

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
  );
}