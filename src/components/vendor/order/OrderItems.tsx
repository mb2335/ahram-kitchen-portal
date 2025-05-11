
import { useLanguage } from "@/contexts/LanguageContext";
import { OrderItem } from "../types";

interface OrderItemsProps {
  items: OrderItem[];
}

export function OrderItems({ items }: OrderItemsProps) {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Order Items</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start py-2 border-b">
            <div className="space-y-1">
              <span className="font-medium">
                {item.quantity}x {language === 'en' ? 
                  (item.menu_item?.name || item.name) : 
                  (item.menu_item?.name_ko || item.nameKo)}
              </span>
              {item.menu_item?.category && (
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? item.menu_item.category.name : item.menu_item.category.name_ko}
                </p>
              )}
              <p className="text-sm text-gray-600">
                ${(item.unit_price || item.price).toFixed(2)} {t('checkout.quantity')}
              </p>
            </div>
            <span className="font-medium">
              ${(item.quantity * (item.unit_price || item.price)).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
