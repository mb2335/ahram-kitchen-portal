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
    discount_percentage?: number;
  }>;
  total: number;
  taxAmount: number;
  createdAt: string;
  pickupDetails?: {
    time: string;
    location: string;
  };
}

export function OrderThankYou() {
  const location = useLocation();
  const { language } = useLanguage();
  const orderDetails = location.state?.orderDetails as OrderDetails | undefined;

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

  // Calculate tax (10% of the discounted subtotal)
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.1;

  // Calculate final total (subtotal - discount + tax)
  const total = subtotal - discountAmount + taxAmount;

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Thanks, your order has been placed.</h1>
          <p className="text-gray-600">
            Here is a detailed summary of your order.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          <p className="text-sm text-gray-600">Order #{orderDetails.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-600">
            Placed on {format(new Date(orderDetails.createdAt), 'PPP')}
          </p>

          {orderDetails.pickupDetails && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Pickup Details</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{orderDetails.pickupDetails.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{orderDetails.pickupDetails.location}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.quantity}x {language === 'en' ? item.name : item.nameKo}</span>
                <div className="text-right">
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  {item.discount_percentage && (
                    <p className="text-sm text-red-500">-${((item.price * item.quantity * item.discount_percentage) / 100).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
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