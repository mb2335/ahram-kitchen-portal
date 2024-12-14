import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary } from './checkout/OrderSummary';
import { CheckoutForm } from './checkout/CheckoutForm';
import { CustomerForm } from './checkout/CustomerForm';

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

  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
    
    if (session?.user) {
      loadUserData();
    }
  }, [session, items.length, navigate]);

  const loadUserData = async () => {
    setIsLoadingUserData(true);
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (customer) {
        setCustomerData({
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleOrderSuccess = async (orderId: string) => {
    clearCart();
    navigate('/orders');
    toast({
      title: "Order Placed Successfully",
      description: "Your order has been confirmed. You can track its status in your order history.",
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
        {!session && (
          <CustomerForm
            fullName={customerData.fullName}
            email={customerData.email}
            phone={customerData.phone}
            onFullNameChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
            onEmailChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
            onPhoneChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
          />
        )}
        <CheckoutForm
          formData={formData}
          setFormData={setFormData}
          customerData={customerData}
          onOrderSuccess={handleOrderSuccess}
          total={total}
          taxAmount={taxAmount}
          items={items}
        />
      </div>
    </div>
  );
}