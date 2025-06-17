import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Order } from './types';
import { CustomerDetails } from './order/CustomerDetails';
import { UnifiedOrderItems } from '@/components/shared/UnifiedOrderItems';
import { OrderDetails } from './order/OrderDetails';
import { OrderActions } from './order/OrderActions';
import { formatCurrency } from '@/utils/formatters';
import { SendSMSToCustomer } from './order/SendSMSToCustomer';
import { PaymentProof } from './order/PaymentProof';
import { OrderNotes } from './order/OrderNotes';

interface OrderCardProps {
  order: Order;
  children?: React.ReactNode;
  onDelete?: (id: string) => void;
}

export function OrderCard({ order, children, onDelete }: OrderCardProps) {
  // Format items for the unified component, preserving each item's actual category
  const formattedItems = order.order_items?.map((item) => {
    console.log("Processing order item:", {
      name: item.menu_item?.name,
      category: item.menu_item?.category?.name
    });
    
    return {
      id: item.id,
      name: item.menu_item?.name || 'Unknown Item',
      nameKo: item.menu_item?.name_ko,
      quantity: item.quantity,
      price: item.unit_price,
      discount_percentage: item.discount_percentage || item.menu_item?.discount_percentage,
      // Use the actual category from the menu item, not a flattened category
      category: item.menu_item?.category ? {
        name: item.menu_item.category.name,
        name_ko: item.menu_item.category.name_ko
      } : undefined
    };
  }) || [];

  console.log("Formatted items for OrderCard:", formattedItems.map(item => ({
    name: item.name,
    category: item.category?.name
  })));

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Order #{order.id.substring(0, 8)}
              </h3>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_at), 'PPpp')}
            </p>
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(order.total_amount)}
            </p>
          </div>
        </div>

        {/* Customer and Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CustomerDetails 
            customer={order.customer} 
            customerName={order.customer_name}
            customerEmail={order.customer_email}
            customerPhone={order.customer_phone}
          />
          <OrderDetails order={order} />
        </div>

        {/* Unified Order Items - each item displays its actual category */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <UnifiedOrderItems items={formattedItems} showPricing={true} />
        </div>

        {order.payment_proof_url && (
          <div className="border-t pt-6">
            <PaymentProof paymentProofUrl={order.payment_proof_url} />
          </div>
        )}

        {/* Display OrderNotes component with rejection reason */}
        <OrderNotes 
          notes={order.notes} 
          rejectionReason={order.rejection_reason} 
        />

        {/* Actions Section */}
        <div className="border-t pt-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              {order.customer?.phone && (
                <SendSMSToCustomer 
                  customerPhone={order.customer.phone} 
                  customerName={order.customer?.full_name || order.customer_name || "Customer"}
                />
              )}
            </div>
            
            {children}
          </div>
          
          {onDelete && (
            <div className="mt-4">
              <OrderActions orderId={order.id} onDelete={onDelete} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
