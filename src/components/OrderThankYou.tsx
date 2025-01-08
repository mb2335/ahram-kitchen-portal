import { useLocation, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';

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
  pickupTime: string | null;
  pickupLocation: string | null;
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

          {(orderDetails.pickupTime || orderDetails.pickupLocation) && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Pickup Details</h3>
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
          )}

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

        <div className="flex justify-center space-x-4">
          <Link to="/">
            <Button variant="outline">Return to Menu</Button>
          </Link>
          <Link to="/orders">
            <Button>View Order History</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}