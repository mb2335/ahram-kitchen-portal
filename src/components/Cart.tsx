import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from '@supabase/auth-helpers-react';

export function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const session = useSession();

  const handleCheckoutClick = () => {
    // Allow direct navigation to checkout for all users
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('cart.empty')}</h2>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('nav.menu')}
            </Button>
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
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in"
          >
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <img
                src={item.image}
                alt={language === 'en' ? item.name : item.nameKo}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-medium text-lg">
                  {language === 'en' ? item.name : item.nameKo}
                </h3>
                <p className="text-primary font-bold">${item.price}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">{t('cart.total')}</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
          onClick={handleCheckoutClick}
        >
          {t('cart.checkout')}
        </Button>
        {!session && (
          <p className="mt-4 text-sm text-gray-600 text-center">
            You can sign in to save your order history, but it's not required to checkout.
          </p>
        )}
      </div>
    </div>
  );
}