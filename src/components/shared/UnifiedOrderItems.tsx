
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderItemData {
  id: string;
  name: string;
  nameKo?: string;
  quantity: number;
  price: number;
  discount_percentage?: number;
  category?: {
    name: string;
    name_ko?: string;
  };
}

interface UnifiedOrderItemsProps {
  items: OrderItemData[];
  showPricing?: boolean;
  className?: string;
}

export function UnifiedOrderItems({ items, showPricing = true, className = "" }: UnifiedOrderItemsProps) {
  const { language, t } = useLanguage();

  // Debug: Log the items to see their category information
  console.log('UnifiedOrderItems received items:', items.map(item => ({
    name: item.name,
    category: item.category,
    categoryName: item.category?.name
  })));

  const calculateItemTotal = (item: OrderItemData) => {
    const originalPrice = item.quantity * item.price;
    const discountAmount = item.discount_percentage
      ? (originalPrice * (item.discount_percentage / 100))
      : 0;
    return originalPrice - discountAmount;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <h4 className="font-semibold text-gray-900">Order Items</h4>
        <Badge variant="secondary" className="text-xs">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id || index}>
            <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {item.quantity}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {language === 'en' ? item.name : (item.nameKo || item.name)}
                    </h5>
                    
                    {item.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {language === 'en' ? item.category.name : (item.category.name_ko || item.category.name)}
                      </Badge>
                    )}
                    
                    {!item.category && (
                      <Badge variant="outline" className="mt-1 text-xs text-gray-400">
                        No category
                      </Badge>
                    )}
                    
                    {showPricing && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span>${item.price.toFixed(2)} each</span>
                        {item.discount_percentage && (
                          <span className="ml-2 text-red-600">
                            ({item.discount_percentage}% off)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {showPricing && (
                <div className="flex-shrink-0 text-right ml-4">
                  <div className="font-semibold text-gray-900">
                    ${calculateItemTotal(item).toFixed(2)}
                  </div>
                  {item.discount_percentage && (
                    <div className="text-sm text-gray-500 line-through">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {index < items.length - 1 && (
              <Separator className="my-2 opacity-30" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
