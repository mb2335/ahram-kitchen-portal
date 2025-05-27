
import { Card } from '@/components/ui/card';
import { UnifiedOrderDetails } from './order/UnifiedOrderDetails';
import { OrderDetails } from './order/OrderDetails';
import { useOrderHistory } from '@/hooks/order/useOrderHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerUnifiedOrders } from '@/hooks/useCustomerUnifiedOrders';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function OrderHistory() {
  const { orders, isLoading, isAuthenticated } = useOrderHistory();
  const unifiedOrders = useCustomerUnifiedOrders(orders || []);
  const [viewMode, setViewMode] = useState<'unified' | 'detailed'>('unified');
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold mb-6">{t('orders.page.title')}</h1>
        <p>{t('orders.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('orders.page.title')}</h1>
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && setViewMode(value as 'unified' | 'detailed')}
          className="border rounded-md"
        >
          <ToggleGroupItem value="unified">Unified View</ToggleGroupItem>
          <ToggleGroupItem value="detailed">Detailed View</ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="space-y-4">
        {viewMode === 'unified' ? (
          <>
            {unifiedOrders.map((unifiedOrder) => (
              <UnifiedOrderDetails key={unifiedOrder.id} unifiedOrder={unifiedOrder} />
            ))}

            {unifiedOrders.length === 0 && (
              <Card className="p-6 text-center">
                <p>{t('orders.empty')}</p>
              </Card>
            )}
          </>
        ) : (
          <>
            {orders?.map((order) => (
              <OrderDetails key={order.id} order={order} />
            ))}

            {orders?.length === 0 && (
              <Card className="p-6 text-center">
                <p>{t('orders.empty')}</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
