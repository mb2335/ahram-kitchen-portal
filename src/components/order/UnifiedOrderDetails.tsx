
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { UnifiedOrder } from '@/types/unifiedOrder';
import { formatCurrency } from '@/utils/formatters';
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge';
import { ChevronDown, ChevronRight, Calendar, MapPin, Clock, Truck, Package } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatTime } from '@/types/delivery';

interface UnifiedOrderDetailsProps {
  unifiedOrder: UnifiedOrder;
}

export function UnifiedOrderDetails({ unifiedOrder }: UnifiedOrderDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium">
                Order #{unifiedOrder.id.substring(0, 8)}
              </h3>
              <OrderStatusBadge status={unifiedOrder.overallStatus} />
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(unifiedOrder.createdAt), 'PPpp')}
            </p>
            {unifiedOrder.categoryDetails.length > 1 && (
              <p className="text-sm text-blue-600 mt-1">
                Multi-category order ({unifiedOrder.categoryDetails.length} categories)
              </p>
            )}
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <p className="text-lg font-bold">
              {formatCurrency(unifiedOrder.totalAmount)}
            </p>
            {unifiedOrder.discountAmount && unifiedOrder.discountAmount > 0 && (
              <p className="text-sm text-red-500">
                -{formatCurrency(unifiedOrder.discountAmount)} discount
              </p>
            )}
          </div>
        </div>

        {/* Category Summary */}
        <div className="mb-4">
          <h4 className="font-medium mb-3">Order Summary</h4>
          <div className="grid gap-2">
            {unifiedOrder.categoryDetails.map((categoryDetail, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                <span className="font-medium">{categoryDetail.categoryName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    {categoryDetail.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
                  </span>
                  <OrderStatusBadge status={categoryDetail.status} />
                  <span className="font-medium">{formatCurrency(categoryDetail.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium text-left border-t pt-4">
            <span>View Fulfillment Details</span>
            {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {unifiedOrder.categoryDetails.map((categoryDetail, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <h4 className="font-medium">{categoryDetail.categoryName}</h4>
                  </div>
                  <OrderStatusBadge status={categoryDetail.status} />
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
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Rejection Reason */}
        {unifiedOrder.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="font-medium text-red-800 mb-1">Order Rejected</h4>
            <p className="text-sm text-red-700">{unifiedOrder.rejectionReason}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
