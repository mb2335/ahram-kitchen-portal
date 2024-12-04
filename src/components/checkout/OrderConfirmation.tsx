import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface OrderConfirmationProps {
  orderId: string;
  items: Array<{
    name: string;
    nameKo: string;
    quantity: number;
    price: number;
  }>;
  deliveryDate: Date;
  notes?: string;
  total: number;
  taxAmount: number;
}

export function OrderConfirmation({ 
  orderId, 
  items, 
  deliveryDate, 
  notes, 
  total, 
  taxAmount 
}: OrderConfirmationProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  useEffect(() => {
    if (!orderId) {
      navigate('/cart');
    }
  }, [orderId, navigate]);

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Order #{orderId.slice(0, 8)}</p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.quantity}x {language === 'en' ? item.name : item.nameKo}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>
              <span>${(total + taxAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Delivery Details</h2>
          <p>Date: {deliveryDate.toLocaleDateString()}</p>
          {notes && <p>Special Instructions: {notes}</p>}
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            A confirmation email has been sent to your registered email address.
          </p>
          <Link to="/">
            <Button>Return to Menu</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}