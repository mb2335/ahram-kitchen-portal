
import { Card } from '@/components/ui/card';
import { SimpleOrderCard } from './order/SimpleOrderCard';
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('orders.page.title')}</h1>
          <p className="text-gray-600 mt-2">Track and view your order history</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">{t('orders.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('orders.page.title')}</h1>
        <p className="text-gray-600 mt-2">Track and view your order history</p>
      </div>
      
      <div className="space-y-6">
        {orders?.map((order) => (
          <SimpleOrderCard key={order.id} order={order} />
        ))}

        {orders?.length === 0 && (
          <Card className="p-12 text-center border-dashed border-2 border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500">{t('orders.empty')}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
