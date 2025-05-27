
import { CategoryFulfillmentDetail } from '@/types/unifiedOrder';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/formatters';
import { formatTime } from '@/types/delivery';
import { MapPin, Clock, Calendar, Truck, Package } from 'lucide-react';

interface CategoryFulfillmentSectionProps {
  categoryDetail: CategoryFulfillmentDetail;
}

export function CategoryFulfillmentSection({ categoryDetail }: CategoryFulfillmentSectionProps) {
  const { language } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <h4 className="font-medium">
            {language === 'en' ? categoryDetail.categoryName : categoryDetail.categoryNameKo || categoryDetail.categoryName}
          </h4>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(categoryDetail.status)}`}>
          {categoryDetail.status.charAt(0).toUpperCase() + categoryDetail.status.slice(1)}
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-1">
        {categoryDetail.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.quantity}x {language === 'en' ? item.name : item.nameKo || item.name}
            </span>
            <span className="font-medium">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Fulfillment Details */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(categoryDetail.deliveryDate).toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>

        {categoryDetail.fulfillmentType === 'pickup' ? (
          <div className="space-y-1">
            {categoryDetail.pickupTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Pickup: {formatTime(categoryDetail.pickupTime)}</span>
              </div>
            )}
            {categoryDetail.pickupLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{categoryDetail.pickupLocation}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {categoryDetail.deliveryAddress && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4 mt-1" />
                <div>
                  <div className="font-medium">Delivery:</div>
                  <div className="whitespace-pre-line">{categoryDetail.deliveryAddress}</div>
                </div>
              </div>
            )}
            {categoryDetail.deliveryTimeSlot && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{categoryDetail.deliveryTimeSlot}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm font-medium">
          <span>Category Subtotal:</span>
          <span>{formatCurrency(categoryDetail.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
