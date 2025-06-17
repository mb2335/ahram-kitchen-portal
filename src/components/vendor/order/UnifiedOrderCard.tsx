
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { UnifiedOrder } from '@/types/unifiedOrder';
import { formatCurrency } from '@/utils/formatters';
import { CategoryFulfillmentSection } from './CategoryFulfillmentSection';
import { PaymentProof } from './PaymentProof';
import { OrderNotes } from './OrderNotes';
import { SendSMSToCustomer } from './SendSMSToCustomer';
import { ChevronDown, ChevronRight, User, Mail, Phone, Package } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { UnifiedOrderItems } from '@/components/shared/UnifiedOrderItems';

interface UnifiedOrderCardProps {
  unifiedOrder: UnifiedOrder;
  children?: React.ReactNode;
  onDelete?: (id: string) => void;
}

export function UnifiedOrderCard({ unifiedOrder, children, onDelete }: UnifiedOrderCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Flatten all items from all categories for unified display, preserving individual item categories
  const allItems = unifiedOrder.categoryDetails.flatMap(categoryDetail => 
    categoryDetail.items.map(item => ({
      id: item.id,
      name: item.name,
      nameKo: item.nameKo,
      quantity: item.quantity,
      price: item.unitPrice,
      discount_percentage: item.discountPercentage,
      category: {
        name: categoryDetail.categoryName,
        name_ko: categoryDetail.categoryNameKo || categoryDetail.categoryName
      }
    }))
  );

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Order #{unifiedOrder.id.substring(0, 8)}
              </h3>
              <Badge className={`${getOverallStatusColor(unifiedOrder.overallStatus)} font-medium`}>
                {unifiedOrder.overallStatus.charAt(0).toUpperCase() + unifiedOrder.overallStatus.slice(1)}
              </Badge>
              {unifiedOrder.categoryDetails.length > 1 && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Package className="w-3 h-3 mr-1" />
                  Multi-category
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(unifiedOrder.createdAt), 'PPpp')}
            </p>
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(unifiedOrder.totalAmount)}
            </p>
            {unifiedOrder.discountAmount && unifiedOrder.discountAmount > 0 && (
              <p className="text-sm text-red-500">
                -{formatCurrency(unifiedOrder.discountAmount)} discount
              </p>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
            <User className="h-4 w-4 text-blue-600" />
            Customer Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{unifiedOrder.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              {unifiedOrder.customerEmail}
            </div>
            {unifiedOrder.customerPhone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                {unifiedOrder.customerPhone}
              </div>
            )}
          </div>
        </div>

        {/* Modern Unified Items Display */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <UnifiedOrderItems items={allItems} showPricing={true} />
        </div>

        {/* Category Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-gray-900">Fulfillment Summary</h4>
          <div className="grid gap-3">
            {unifiedOrder.categoryDetails.map((categoryDetail, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-3 bg-white rounded border">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{categoryDetail.categoryName}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryDetail.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${getOverallStatusColor(categoryDetail.status)}`}>
                    {categoryDetail.status}
                  </Badge>
                  <span className="font-semibold text-gray-900">{formatCurrency(categoryDetail.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 font-medium text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">View Category Details</span>
            {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {unifiedOrder.categoryDetails.map((categoryDetail, index) => (
              <CategoryFulfillmentSection key={index} categoryDetail={categoryDetail} />
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Payment Proof */}
        {unifiedOrder.paymentProofUrl && (
          <div className="border-t pt-6">
            <PaymentProof paymentProofUrl={unifiedOrder.paymentProofUrl} />
          </div>
        )}

        {/* Notes */}
        {(unifiedOrder.notes || unifiedOrder.rejectionReason) && (
          <OrderNotes 
            notes={unifiedOrder.notes} 
            rejectionReason={unifiedOrder.rejectionReason} 
          />
        )}

        {/* Actions */}
        <div className="border-t pt-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              {unifiedOrder.customerPhone && (
                <SendSMSToCustomer 
                  customerPhone={unifiedOrder.customerPhone} 
                  customerName={unifiedOrder.customerName}
                />
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </Card>
  );
}
