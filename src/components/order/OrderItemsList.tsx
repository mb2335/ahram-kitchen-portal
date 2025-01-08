import { useLanguage } from "@/contexts/LanguageContext";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    name: string;
    name_ko: string;
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
  const { language } = useLanguage();

  return (
    <div className="space-y-2">
      <h3 className="font-medium mb-2">Order Items</h3>
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-start py-2 border-b">
          <div className="space-y-1">
            <span className="font-medium">
              {item.quantity}x {language === 'en' ? item.menu_item?.name : item.menu_item?.name_ko}
            </span>
            {item.menu_item?.category && (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? item.menu_item.category.name : item.menu_item.category.name_ko}
              </p>
            )}
            <p className="text-sm text-gray-600">
              ${item.unit_price.toFixed(2)} each
            </p>
          </div>
          <span className="font-medium">
            ${(item.quantity * item.unit_price).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}