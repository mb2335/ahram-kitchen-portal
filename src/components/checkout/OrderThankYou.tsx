import { useLocation, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface OrderDetails {
  id: string;
  items: Array<{
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  taxAmount: number;
  createdAt: string;
}

export function OrderThankYou() {
  const location = useLocation();
  const { language } = useLanguage();
  const orderDetails = location.state?.orderDetails as OrderDetails | undefined;

  if (!orderDetails) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Thanks, your order has been placed.</h1>
          <p className="text-gray-600">
            Here is a detailed summary of your order. Contact mjbutler.35@gmail.com if you have any questions, changes, etc.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          <p className="text-sm text-gray-600">Order #{orderDetails.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">
            Placed on {format(new Date(orderDetails.createdAt), 'PPP')}
          </p>

          <div className="space-y-2">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {language === 'en' ? item.name : item.nameKo}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${(orderDetails.total - orderDetails.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${orderDetails.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>
              <span>${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}