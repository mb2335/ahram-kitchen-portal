
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { UnifiedOrder } from '@/types/unifiedOrder';
import { formatCurrency } from '@/utils/formatters';
import { CategoryFulfillmentSection } from './CategoryFulfillmentSection';
import { PaymentProof } from './PaymentProof';
import { OrderNotes } from './OrderNotes';
import { SendSMSToCustomer } from './SendSMSToCustomer';
import { ChevronDown, ChevronRight, User, Mail, Phone } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <span className={`text-sm px-3 py-1 rounded-full ${getOverallStatusColor(unifiedOrder.overallStatus)}`}>
                {unifiedOrder.overallStatus.charAt(0).toUpperCase() + unifiedOrder.overallStatus.slice(1)}
              </span>
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

        {/* Customer Details */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Information
          </h4>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="font-medium">{unifiedOrder.customerName}</span>
            </p>
            <p className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              {unifiedOrder.customerEmail}
            </p>
            {unifiedOrder.customerPhone && (
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                {unifiedOrder.customerPhone}
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
                  <span className={`text-xs px-2 py-1 rounded ${getOverallStatusColor(categoryDetail.status)}`}>
                    {categoryDetail.status}
                  </span>
                  <span className="font-medium">{formatCurrency(categoryDetail.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium text-left border-t pt-4">
            <span>View Category Details</span>
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
          <div className="mt-4 border-t pt-4">
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
        <div className="mt-4 border-t pt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
