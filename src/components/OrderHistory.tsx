
import { Card } from '@/components/ui/card';
import { UnifiedOrderDetails } from './order/UnifiedOrderDetails';
import { useOrderHistory } from '@/hooks/order/useOrderHistory';
import { useCustomerUnifiedOrders } from '@/hooks/useCustomerUnifiedOrders';
import { useLanguage } from '@/contexts/LanguageContext';

export function OrderHistory() {
  const { orders, isLoading, isAuthenticated } = useOrderHistory();
  const { t } = useLanguage();
  const unifiedOrderGroups = useCustomerUnifiedOrders(orders || []);

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
      <h1 className="text-2xl font-bold mb-6">{t('orders.page.title')}</h1>
      <div className="space-y-4">
        {unifiedOrderGroups?.map((orderGroup) => (
          <UnifiedOrderDetails key={orderGroup.unifiedOrder.id} unifiedOrder={orderGroup.unifiedOrder} />
        ))}

        {unifiedOrderGroups?.length === 0 && (
          <Card className="p-6 text-center">
            <p>{t('orders.empty')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
