import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, History, LogOut, Store, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useToast } from "@/components/ui/use-toast";

interface NavigationLinksProps {
  isVendor: boolean;
  onSignOut: () => Promise<void>;
}

export function NavigationLinks({ isVendor, onSignOut }: NavigationLinksProps) {
  const { language } = useLanguage();
  const session = useSession();

  return (
    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
      <Link to="/" className="md:mr-4">
        <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start">
          <MenuIcon className="h-5 w-5 mr-2" />
          {language === 'en' ? 'Menu' : '메뉴'}
        </Button>
      </Link>

      {session && (
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0">
          <Link to="/orders" className="md:mr-4">
            <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start">
              <History className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Order History' : '주문 내역'}
            </Button>
          </Link>
          <Link to="/profile" className="md:mr-4">
            <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start">
              <User className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Profile' : '프로필'}
            </Button>
          </Link>
        </div>
      )}

      {isVendor && session && (
        <Link to="/vendor/summary" className="md:mr-4">
          <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start">
            <Store className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Vendor Dashboard' : '판매자 대시보드'}
          </Button>
        </Link>
      )}

      {session ? (
        <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full md:w-auto justify-start">
          <LogOut className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Sign Out' : '로그아웃'}
        </Button>
      ) : (
        <Link to="/auth">
          <Button variant="ghost" size="sm" className="w-full md:w-auto justify-start">
            {language === 'en' ? 'Sign In' : '로그인'}
          </Button>
        </Link>
      )}
    </div>
  );
}