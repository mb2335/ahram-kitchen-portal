
import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { Order } from '@/components/vendor/types';
import { PaymentProof } from '@/components/vendor/order/PaymentProof';
import { User, Mail, Phone, MapPin, Clock, Calendar, Package } from 'lucide-react';

interface SimpleOrderCardProps {
  order: Order;
  showCustomerInfo?: boolean;
  actions?: React.ReactNode;
}

export function SimpleOrderCard({ order, showCustomerInfo = false, actions }: SimpleOrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const calculateItemTotal = (item: any) => {
    const basePrice = item.quantity * item.unit_price;
    const discountAmount = item.discount_percentage 
      ? (basePrice * (item.discount_percentage / 100))
      : 0;
    return basePrice - discountAmount;
  };

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order.id.substring(0, 8)}
              </h3>
              <Badge className={`${getStatusColor(order.status)} font-medium`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_at), 'PPpp')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(order.total_amount)}
            </p>
            {order.discount_amount && order.discount_amount > 0 && (
              <p className="text-sm text-red-500">
                -{formatCurrency(order.discount_amount)} discount
              </p>
            )}
          </div>
        </div>

        {/* Customer Information */}
        {showCustomerInfo && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
              <User className="h-4 w-4 text-blue-600" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {order.customer?.full_name || order.customer_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                {order.customer?.email || order.customer_email}
              </div>
              {(order.customer?.phone || order.customer_phone) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  {order.customer?.phone || order.customer_phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <h4 className="font-semibold text-gray-900">Order Items</h4>
            <Badge variant="secondary" className="text-xs">
              {order.order_items?.length || 0} {(order.order_items?.length || 0) === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {order.order_items?.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {item.quantity}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">
                      {item.menu_item?.name || 'Unknown Item'}
                    </h5>
                    
                    {item.menu_item?.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {item.menu_item.category.name}
                      </Badge>
                    )}
                    
                    <div className="mt-1 text-sm text-gray-600">
                      ${item.unit_price.toFixed(2)} each
                      {item.discount_percentage && (
                        <span className="ml-2 text-red-600">
                          ({item.discount_percentage}% off)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${calculateItemTotal(item).toFixed(2)}
                  </div>
                  {item.discount_percentage && (
                    <div className="text-sm text-gray-500 line-through">
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfillment Details */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-gray-900">Fulfillment Details</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(order.delivery_date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            {order.fulfillment_type === 'pickup' && (
              <>
                {order.pickup_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Pickup Time: {order.pickup_time}</span>
                  </div>
                )}
                {order.pickup_location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Pickup Location: {order.pickup_location}</span>
                  </div>
                )}
              </>
            )}

            {order.fulfillment_type === 'delivery' && (
              <>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-1" />
                  <div>
                    <div className="font-medium">Delivery Address:</div>
                    <div className="whitespace-pre-line">
                      {order.delivery_address || "No address provided"}
                    </div>
                  </div>
                </div>
                {order.delivery_time_slot && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Delivery Time: {order.delivery_time_slot}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment Proof */}
        {order.payment_proof_url && (
          <div className="border-t pt-4">
            <PaymentProof paymentProofUrl={order.payment_proof_url} />
          </div>
        )}

        {/* Notes */}
        {(order.notes || order.rejection_reason) && (
          <div className="border-t pt-4 space-y-2">
            {order.notes && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {order.notes}
              </p>
            )}
            {order.rejection_reason && (
              <p className="text-sm text-red-600">
                <span className="font-medium">Rejection Reason:</span> {order.rejection_reason}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="border-t pt-4">
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
}
