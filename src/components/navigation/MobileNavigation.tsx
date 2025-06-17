
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

interface MobileNavigationProps {
  isVendor: boolean;
  session: any;
  handleSignOut: () => void;
}

export function MobileNavigation({ isVendor, session, handleSignOut }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { items } = useCart();
  const { t } = useLanguage();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const closeSheet = () => setIsOpen(false);

  return (
    <div className="md:hidden flex items-center space-x-4">
      <Link to="/cart" className="relative text-gray-700 hover:text-primary transition-colors">
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Link>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[250px]">
          <div className="flex flex-col space-y-4 mt-6">
            <LanguageToggle />
            
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary transition-colors py-2"
              onClick={closeSheet}
            >
              {t('nav.menu')}
            </Link>
            
            <Link 
              to="/help" 
              className="text-gray-700 hover:text-primary transition-colors py-2"
              onClick={closeSheet}
            >
              {t('nav.faq')}
            </Link>

            {session ? (
              <>
                {isVendor && (
                  <Link 
                    to="/vendor/summary" 
                    className="text-gray-700 hover:text-primary transition-colors py-2"
                    onClick={closeSheet}
                  >
                    {t('nav.vendor')}
                  </Link>
                )}
                <Link 
                  to="/orders" 
                  className="text-gray-700 hover:text-primary transition-colors py-2"
                  onClick={closeSheet}
                >
                  {t('nav.orders')}
                </Link>
                <Link 
                  to="/profile" 
                  className="text-gray-700 hover:text-primary transition-colors py-2"
                  onClick={closeSheet}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  {t('nav.profile')}
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleSignOut();
                    closeSheet();
                  }}
                  className="justify-start"
                >
                  {t('nav.signout')}
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={closeSheet}>
                <Button variant="outline" className="w-full justify-start">
                  {t('nav.signin')}
                </Button>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
