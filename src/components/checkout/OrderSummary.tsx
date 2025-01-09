import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Order Summary</h2>
      
      {categories.map((category) => (
        itemsByCategory[category.id] && (
          <div key={category.id} className="space-y-4">
            <h3 className="font-medium text-lg">
              {language === 'en' ? category.name : category.name_ko}
            </h3>
            {itemsByCategory[category.id].map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {language === 'en' ? item.name : item.name_ko}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <Separator />
          </div>
        )
      ))}

      {itemsByCategory['uncategorized'] && (
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Other Items</h3>
          {itemsByCategory['uncategorized'].map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {language === 'en' ? item.name : item.name_ko}
                </p>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <Separator />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-center text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-red-500">
          <span>Discount</span>
          <span>-${totalDiscount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-gray-600">
          <span>Tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center font-semibold text-lg">
          <span>Total</span>
          <span>${(subtotal - totalDiscount + taxAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}