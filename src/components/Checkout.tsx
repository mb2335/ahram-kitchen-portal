import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary } from './checkout/OrderSummary';
import { CheckoutForm } from './checkout/CheckoutForm';

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const TAX_RATE = 0.1;
  const taxAmount = total * TAX_RATE;

  const [formData, setFormData] = useState({
    notes: '',
    deliveryDate: new Date(),
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const handleOrderSuccess = async (orderId: string) => {
    clearCart();
    navigate('/thank-you', {
      state: {
        orderDetails: {
          id: orderId,
          items: items.map(item => ({
            name: item.name,
            nameKo: item.nameKo,
            quantity: item.quantity,
            price: item.price
          })),
          total: total + taxAmount,
          taxAmount: taxAmount,
          createdAt: new Date().toISOString()
        }
      }
    });
    toast({
      title: "Order Placed Successfully",
      description: "Your order has been confirmed. Thank you for your purchase!",
    });
  };

  if (isLoadingUserData) {
    return (
      <div className="container mx-auto max-w-2xl p-6 text-center">
        <p>Loading your information...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="space-y-6">
        <OrderSummary />
        <CheckoutForm
          formData={formData}
          setFormData={setFormData}
          onOrderSuccess={handleOrderSuccess}
          total={total}
          taxAmount={taxAmount}
          items={items}
        />
      </div>
    </div>
  );
}