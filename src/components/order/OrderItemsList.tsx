
import { useLanguage } from "@/contexts/LanguageContext";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    name: string;
    name_ko: string;
    discount_percentage?: number;
    category?: {
      name: string;
      name_ko: string;
    };
  };
}

interface OrderItemsListProps {
  items: OrderItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  const { language, t } = useLanguage();

  const calculateItemTotal = (item: OrderItem) => {
    const originalPrice = item.quantity * item.unit_price;
    const discountAmount = item.menu_item?.discount_percentage
      ? (originalPrice * (item.menu_item.discount_percentage / 100))
      : 0;
    return originalPrice - discountAmount;
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Order Items</h3>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-start py-2 border-b">
          <div className="space-y-1">
            <span className="font-medium">
              {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}
            </span>
            <p className="text-sm text-gray-500">
              {t('checkout.quantity')}: {item.quantity}
            </p>
            {item.menu_item?.category && (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? item.menu_item.category.name : item.menu_item.category.name_ko}
              </p>
            )}
            <div className="text-sm space-y-1">
              <p className="text-gray-600">
                ${item.unit_price.toFixed(2)} {t('checkout.quantity')}
              </p>
              {item.menu_item?.discount_percentage && (
                <p className="text-red-500">
                  {item.menu_item.discount_percentage}% {t('checkout.discount')}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="font-medium">
              ${calculateItemTotal(item).toFixed(2)}
            </span>
            {item.menu_item?.discount_percentage && (
              <p className="text-sm text-red-500 line-through">
                ${(item.quantity * item.unit_price).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
