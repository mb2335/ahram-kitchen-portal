import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderSummary as SharedOrderSummary } from "@/components/shared/OrderSummary";

export function OrderSummary() {
  const { items } = useCart();
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

  // Calculate tax (10% of the discounted subtotal)
  const taxRate = 0.1;
  const taxableAmount = subtotal - totalDiscount;
  const taxAmount = taxableAmount * taxRate;

  // Calculate final total
  const total = taxableAmount + taxAmount;

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