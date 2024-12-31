import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, History, LogOut, Store, ShoppingCart, User, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

interface NavigationItemsProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => Promise<void>;
  isMobile?: boolean;
}

export function NavigationItems({ isVendor, session, handleSignOut, isMobile = false }: NavigationItemsProps) {
  const { language } = useLanguage();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const buttonClass = isMobile ? "w-full justify-start" : "flex items-center";
  const iconClass = isMobile ? "h-5 w-5 mr-3" : "h-4 w-4 sm:mr-2";

  return (
    <>
      <Link to="/" className={isMobile ? "w-full" : ""}>
        <Button variant="ghost" size={isMobile ? "lg" : "sm"} className={buttonClass}>
          <MenuIcon className={iconClass} />
          <span className={isMobile ? "" : "hidden sm:inline"}>
            {language === 'en' ? 'Menu' : '메뉴'}
          </span>
        </Button>
      </Link>

      <Link to="/help" className={isMobile ? "w-full" : ""}>
        <Button variant="ghost" size={isMobile ? "lg" : "sm"} className={buttonClass}>
          <HelpCircle className={iconClass} />
          <span className={isMobile ? "" : "hidden sm:inline"}>
            {language === 'en' ? 'Help' : '도움말'}
          </span>
        </Button>
      </Link>

      {session && (
        <>
          <Link to="/orders" className={isMobile ? "w-full" : ""}>
            <Button variant="ghost" size={isMobile ? "lg" : "sm"} className={buttonClass}>
              <History className={iconClass} />
              <span className={isMobile ? "" : "hidden sm:inline"}>
                {language === 'en' ? 'Order History' : '주문 내역'}
              </span>
            </Button>
          </Link>
          <Link to="/profile" className={isMobile ? "w-full" : ""}>
            <Button variant="ghost" size={isMobile ? "lg" : "sm"} className={buttonClass}>
              <User className={iconClass} />
              <span className={iMobile ? "" : "hidden sm:inline"}>
                {language === 'en' ? 'Profile' : '프로필'}
              </span>
            </Button>
          </Link>
        </>
      )}

      {isVendor && session && (
        <Link to="/vendor/summary" className={isMobile ? "w-full" : ""}>
          <Button variant="ghost" size={isMobile ? "lg" : "sm"} className={buttonClass}>
            <Store className={iconClass} />
            <span className={isMobile ? "" : "hidden sm:inline"}>
              {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
            </span>
          </Button>
        </Link>
      )}

      {session ? (
        <Button 
          variant="ghost" 
          size={iMobile ? "lg" : "sm"} 
          onClick={handleSignOut}
          className={buttonClass}
        >
          <LogOut className={iconClass} />
          <span className={iMobile ? "" : "hidden sm:inline"}>
            {language === 'en' ? 'Sign Out' : '로그아웃'}
          </span>
        </Button>
      ) : (
        <Link to="/auth" className={isMobile ? "w-full" : ""}>
          <Button variant="ghost" size={iMobile ? "lg" : "sm"} className={buttonClass}>
            <User className={iconClass} />
            <span className={iMobile ? "" : "hidden sm:inline"}>
              {language === 'en' ? 'Sign In' : '로그인'}
            </span>
          </Button>
        </Link>
      )}

      <Link to="/cart" className={isMobile ? "w-full" : ""}>
        <Button 
          variant="default" 
          size={iMobile ? "lg" : "sm"} 
          className={`bg-primary relative ${buttonClass}`}
        >
          <ShoppingCart className={iconClass} />
          <span className={iMobile ? "" : "hidden sm:inline"}>
            {language === 'en' ? 'Cart' : '장바구니'}
          </span>
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
              {cartItemCount}
            </span>
          )}
        </Button>
      </Link>
    </>
  );
}