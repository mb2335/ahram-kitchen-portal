
import { useLocation, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PaymentProof } from '@/components/vendor/order/PaymentProof';
import { OrderSummary } from '@/components/shared/OrderSummary';
import { useSession } from '@supabase/auth-helpers-react';

interface OrderDetails {
  id: string;
  items: Array<{
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
    discount_percentage?: number;
    category?: {
      name: string;
      name_ko?: string;
    };
  }>;
  total: number;
  subtotal: number;
  createdAt: string;
  pickupTime?: string | null;
  pickupLocation?: string | null;
  paymentProofUrl?: string;
}

export function OrderThankYou() {
  const location = useLocation();
  const orderDetails = location.state?.orderDetails as OrderDetails | undefined;
  const { language, t } = useLanguage();
  const session = useSession();
  const isAuthenticated = !!session;

  if (!orderDetails) {
    return <Navigate to="/" replace />;
  }

  // Calculate subtotal (sum of regular prices)
  const subtotal = orderDetails.items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  // Calculate total discount
  const discountAmount = orderDetails.items.reduce((acc, item) => {
    if (!item.discount_percentage) return acc;
    const itemTotal = item.price * item.quantity;
    return acc + (itemTotal * (item.discount_percentage / 100));
  }, 0);

  // Calculate final total (subtotal - discount)
  const total = subtotal - discountAmount;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">{t('checkout.thankyou.title')}</h1>
          <p className="text-gray-600">
            {t('checkout.thankyou.details')}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">{t('checkout.summary')}</h2>
          <p className="text-sm text-gray-600">{t('checkout.thankyou.id')}{orderDetails.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">
            {t('checkout.thankyou.placed')} {format(new Date(orderDetails.createdAt), 'PPP')}
          </p>

          {(orderDetails.pickupTime || orderDetails.pickupLocation) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">{t('checkout.thankyou.pickup')}</h3>
                {orderDetails.pickupTime && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{orderDetails.pickupTime}</span>
                  </div>
                )}
                {orderDetails.pickupLocation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{orderDetails.pickupLocation}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <OrderSummary
            items={orderDetails.items}
            subtotal={subtotal}
            total={total}
            discountAmount={discountAmount}
          />
        </div>

        {orderDetails.paymentProofUrl && (
          <PaymentProof paymentProofUrl={orderDetails.paymentProofUrl} />
        )}

        <div className="flex justify-center space-x-4">
          <Link to="/">
            <Button variant="outline">{t('checkout.thankyou.return')}</Button>
          </Link>
          
          {/* Only show View Orders button for authenticated users */}
          {isAuthenticated && (
            <Link to="/orders">
              <Button>{t('checkout.thankyou.vieworders')}</Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
