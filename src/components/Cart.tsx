import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from "./ui/use-toast";

export function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const session = useSession();
  const { toast } = useToast();

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('cart.empty')}</h2>
          <Link to="/">
            <Button>{t('nav.menu')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow animate-fade-in"
          >
            <div className="flex items-center space-x-4">
              <img
                src={item.image}
                alt={language === 'en' ? item.name : item.nameKo}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold">
                  {language === 'en' ? item.name : item.nameKo}
                </h3>
                <p className="text-gray-600">${item.price}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">{t('cart.total')}</span>
          <span className="text-lg font-bold">${total.toFixed(2)}</span>
        </div>
        <Button className="w-full" onClick={handleCheckoutClick}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}