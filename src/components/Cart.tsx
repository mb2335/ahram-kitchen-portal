import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useSession } from '@supabase/auth-helpers-react';
import { Separator } from "./ui/separator";
import { CartItem } from "./cart/CartItem";
import { CartSummary } from "./cart/CartSummary";
import { EmptyCart } from "./cart/EmptyCart";
import { useCartCategories } from "@/hooks/cart/useCartCategories";

export function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const session = useSession();

  const { categories, itemsByCategory } = useCartCategories(items);

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-4">
        {categories.map((category) => (
          itemsByCategory[category.id] && (
            <div key={category.id} className="space-y-4">
              <h2 className="text-xl font-semibold">
                {language === 'en' ? category.name : category.name_ko}
              </h2>
              {itemsByCategory[category.id].map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
              <Separator />
            </div>
          )
        ))}

        {itemsByCategory['uncategorized'] && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Menu</h2>
            {itemsByCategory['uncategorized'].map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
            <Separator />
          </div>
        )}
      </div>

      <CartSummary
        total={total}
        onCheckout={handleCheckoutClick}
        isAuthenticated={!!session}
      />
    </div>
  );
}