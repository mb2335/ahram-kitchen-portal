
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

interface OrderSummaryProps {
  subtotal: number;
  total: number;
  discountAmount?: number;
  items?: Array<{
    name: string;
    nameKo?: string;
    quantity: number;
    price: number;
    discount_percentage?: number;
    category?: {
      name: string;
      name_ko?: string;
    };
  }>;
  showItems?: boolean;
}

export function OrderSummary({ 
  subtotal, 
  total, 
  discountAmount = 0,
  items = [],
  showItems = true 
}: OrderSummaryProps) {
  const { language, t } = useLanguage();

  const calculateItemPrice = (item: typeof items[0]) => {
    const originalPrice = item.price * item.quantity;
    if (item.discount_percentage) {
      const discountMultiplier = (100 - item.discount_percentage) / 100;
      return originalPrice * discountMultiplier;
    }
    return originalPrice;
  };

  return (
    <div className="space-y-4">
      {showItems && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium">
                    {language === 'en' ? item.name : item.nameKo}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('checkout.quantity')}: {item.quantity}
                  </p>
                  {item.category && (
                    <p className="text-sm text-gray-500">
                      {language === 'en' ? item.category.name : item.category.name_ko}
                    </p>
                  )}
                  {item.discount_percentage && (
                    <p className="text-sm text-red-500">
                      {item.discount_percentage}% {t('checkout.discount')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">${calculateItemPrice(item).toFixed(2)}</p>
                  {item.discount_percentage && (
                    <p className="text-sm text-gray-500 line-through">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">{t('checkout.subtotal')}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-500">
            <span>{t('checkout.discount')}</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>{t('checkout.total')}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
