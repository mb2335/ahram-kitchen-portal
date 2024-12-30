import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

export function CartButton() {
  const { language } = useLanguage();
  const { items } = useCart();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link to="/cart">
      <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90 relative">
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
  );
}