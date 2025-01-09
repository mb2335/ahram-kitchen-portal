import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderSummary as SharedOrderSummary } from "@/components/shared/OrderSummary";

export function OrderSummary() {
  const { items, total } = useCart();
  const { language } = useLanguage();

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

  // Calculate subtotal and total discount
  const { subtotal, totalDiscount } = items.reduce((acc, item) => {
    const originalPrice = item.price * item.quantity;
    const discountAmount = item.discount_percentage 
      ? (originalPrice * (item.discount_percentage / 100))
      : 0;
    
    return {
      subtotal: acc.subtotal + originalPrice,
      totalDiscount: acc.totalDiscount + discountAmount
    };
  }, { subtotal: 0, totalDiscount: 0 });

  // Calculate tax (10% of the discounted subtotal)
  const taxRate = 0.1;
  const taxableAmount = subtotal - totalDiscount;
  const taxAmount = taxableAmount * taxRate;

  const formattedItems = items.map(item => ({
    name: item.name,
    nameKo: item.name_ko,
    quantity: item.quantity,
    price: item.price,
    discount_percentage: item.discount_percentage,
    category: categories.find(cat => cat.id === item.category_id)
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Order Summary</h2>
      <SharedOrderSummary
        items={formattedItems}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        discountAmount={totalDiscount}
      />
    </div>
  );
}