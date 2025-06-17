
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DesktopNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => void;
}

export function DesktopNavigation({ isVendor, session, handleSignOut }: DesktopNavigationProps) {
  const { items } = useCart();
  const { t } = useLanguage();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="hidden md:flex items-center space-x-6">
      <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
        {t('nav.menu')}
      </Link>
      
      <Link to="/help" className="text-gray-700 hover:text-primary transition-colors">
        {t('nav.faq')}
      </Link>
      
      <Link to="/cart" className="relative text-gray-700 hover:text-primary transition-colors">
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Link>

      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>{t('nav.profile')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isVendor && (
              <DropdownMenuItem asChild>
                <Link to="/vendor/summary">{t('nav.vendor')}</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/orders">{t('nav.orders')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile">{t('nav.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              {t('nav.signout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/auth">
          <Button variant="outline" size="sm">
            {t('nav.signin')}
          </Button>
        </Link>
      )}
    </div>
  );
}
