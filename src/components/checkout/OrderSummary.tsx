
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Calendar } from "lucide-react";
import { PickupDetail } from "@/types/pickup";
import { format } from "date-fns";

interface OrderSummaryProps {
  taxAmount: number;
  pickupDate?: Date;
  pickupDetail?: PickupDetail | null;
  fulfillmentType?: string;
}

export function OrderSummary({ 
  taxAmount,
  pickupDate,
  pickupDetail,
  fulfillmentType
}: OrderSummaryProps) {
  const { language } = useLanguage();
  const { items, total } = useCart();
  
  // Calculate the subtotal (total without tax)
  const subtotal = total;
  
  // Group items by category for easier display
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
      
      {Object.entries(itemsByCategory).map(([categoryId, categoryItems]) => (
        <div key={categoryId} className="space-y-4 mb-4">
          {/* Show category name if it's not 'uncategorized' */}
          {categoryId !== 'uncategorized' && (
            <h3 className="font-medium text-gray-700">
              {/* Since we don't have category_name directly in the item, we'll just show "Category" */}
              {language === 'en' ? "Category" : "카테고리"}
            </h3>
          )}
          
          {categoryItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="font-medium">
                  {language === 'en' ? item.name : item.name_ko}
                </p>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
                {item.discount_percentage && (
                  <p className="text-sm text-red-500">
                    {item.discount_percentage}% OFF
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                {item.discount_percentage && (
                  <p className="text-sm text-gray-500 line-through">
                    ${(item.price * item.quantity * (100 / (100 - item.discount_percentage))).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
          <Separator />
        </div>
      ))}

      {/* Display unified pickup details if applicable */}
      {fulfillmentType === 'pickup' && pickupDate && (
        <div className="bg-gray-50 p-3 rounded-md mb-3">
          <h3 className="font-medium mb-2">Pickup Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{format(pickupDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            {pickupDetail && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{pickupDetail.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{pickupDetail.location}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${(subtotal + taxAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
