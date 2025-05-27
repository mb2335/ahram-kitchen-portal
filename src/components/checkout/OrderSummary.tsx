
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderSummary as SharedOrderSummary } from "@/components/shared/OrderSummary";

export function OrderSummary() {
  const { items } = useCart();
  const { language, t } = useLanguage();

  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate subtotal (before discounts)
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  // Calculate total discount
  const totalDiscount = items.reduce((acc, item) => {
    if (!item.discount_percentage) return acc;
    const itemTotal = item.price * item.quantity;
    return acc + (itemTotal * (item.discount_percentage / 100));
  }, 0);

  // Calculate final total (without tax)
  const total = subtotal - totalDiscount;

  const formattedItems = items.map(item => {
    const category = categories.find(cat => cat.id === item.category_id);
    return {
      name: item.name,
      nameKo: item.name_ko,
      quantity: item.quantity,
      price: item.price,
      discount_percentage: item.discount_percentage,
      category: category ? {
        name: category.name,
        name_ko: category.name_ko
      } : undefined
    };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('checkout.summary')}</h2>
      <SharedOrderSummary
        items={formattedItems}
        subtotal={subtotal}
        total={total}
        discountAmount={totalDiscount}
      />
    </div>
  );
}
