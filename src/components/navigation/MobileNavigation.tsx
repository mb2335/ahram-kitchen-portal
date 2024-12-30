import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon, History, LogOut, Store, ShoppingCart, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

interface MobileNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => Promise<void>;
}

export function MobileNavigation({ isVendor, session, handleSignOut }: MobileNavigationProps) {
  const { language, setLanguage } = useLanguage();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  return (
    <div className="sm:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center">
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[80%] sm:w-[385px]">
          <div className="flex flex-col space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold">
                {language === 'en' ? 'Menu' : '메뉴'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-sm">ENG</span>
                <Switch
                  checked={language === 'ko'}
                  onCheckedChange={toggleLanguage}
                />
                <span className="text-sm">KOR</span>
              </div>
            </div>
            
            <Link to="/" className="w-full">
              <Button variant="ghost" size="lg" className="w-full justify-start">
                <MenuIcon className="h-5 w-5 mr-3" />
                {language === 'en' ? 'Browse Menu' : '메뉴 보기'}
              </Button>
            </Link>

            {session && (
              <>
                <Link to="/orders" className="w-full">
                  <Button variant="ghost" size="lg" className="w-full justify-start">
                    <History className="h-5 w-5 mr-3" />
                    {language === 'en' ? 'Order History' : '주문 내역'}
                  </Button>
                </Link>
                <Link to="/profile" className="w-full">
                  <Button variant="ghost" size="lg" className="w-full justify-start">
                    <User className="h-5 w-5 mr-3" />
                    {language === 'en' ? 'My Profile' : '내 프로필'}
                  </Button>
                </Link>
              </>
            )}

            {isVendor && session && (
              <Link to="/vendor/summary" className="w-full">
                <Button variant="ghost" size="lg" className="w-full justify-start">
                  <Store className="h-5 w-5 mr-3" />
                  {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
                </Button>
              </Link>
            )}

            {session ? (
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={handleSignOut}
                className="w-full justify-start"
              >
                <LogOut className="h-5 w-5 mr-3" />
                {language === 'en' ? 'Sign Out' : '로그아웃'}
              </Button>
            ) : (
              <Link to="/auth" className="w-full">
                <Button variant="ghost" size="lg" className="w-full justify-start">
                  <User className="h-5 w-5 mr-3" />
                  {language === 'en' ? 'Sign In' : '로그인'}
                </Button>
              </Link>
            )}

            <Link to="/cart" className="w-full">
              <Button 
                variant="default" 
                size="lg" 
                className="w-full justify-start bg-primary relative"
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
                {language === 'en' ? 'Shopping Cart' : '장바구니'}
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-2 bg-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}