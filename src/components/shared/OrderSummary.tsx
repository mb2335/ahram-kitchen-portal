interface OrderSummaryProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  items?: Array<{
    name: string;
    nameKo?: string;
    quantity: number;
    price: number;
    category?: {
      name: string;
      name_ko?: string;
    };
  }>;
  showItems?: boolean;
}

import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

export function OrderSummary({ 
  subtotal, 
  taxAmount, 
  total, 
  discountAmount = 0,
  items = [],
  showItems = true 
}: OrderSummaryProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      {showItems && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {language === 'en' ? item.name : item.nameKo}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}