
import { Card } from '@/components/ui/card';
import { OrderDetails } from './order/OrderDetails';
import { useOrderHistory } from '@/hooks/order/useOrderHistory';
import { useLanguage } from '@/contexts/LanguageContext';

export function OrderHistory() {
  const { orders, isLoading, isAuthenticated } = useOrderHistory();
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
      <h1 className="text-2xl font-bold mb-6">{t('orders.page.title')}</h1>
      <div className="space-y-4">
        {orders?.map((order) => (
          <OrderDetails key={order.id} order={order} />
        ))}

        {orders?.length === 0 && (
          <Card className="p-6 text-center">
            <p>{t('orders.empty')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
