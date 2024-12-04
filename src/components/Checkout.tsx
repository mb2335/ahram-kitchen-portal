import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary } from './checkout/OrderSummary';
import { CheckoutForm } from './checkout/CheckoutForm';
import { OrderConfirmation } from './checkout/OrderConfirmation';

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const TAX_RATE = 0.1;
  const taxAmount = total * TAX_RATE;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
    deliveryDate: new Date(),
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth', { state: { returnTo: '/checkout' } });
    } else if (items.length === 0) {
      navigate('/cart');
    } else {
      fetchUserData();
    }
  }, [session, items.length, navigate]);

  const fetchUserData = async () => {
    if (!session?.user.id) return;
    
    setIsLoadingUserData(true);
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('full_name, email, phone')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching customer data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your information. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (customer) {
        setFormData(prev => ({
          ...prev,
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone || '',
        }));
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleOrderSuccess = (orderId: string) => {
    setConfirmedOrder(orderId);
    clearCart();
  };

  if (isLoadingUserData) {
    return (
      <div className="container mx-auto max-w-2xl p-6 text-center">
        <p>Loading your information...</p>
      </div>
    );
  }

  if (confirmedOrder) {
    return (
      <OrderConfirmation
        orderId={confirmedOrder}
        items={items}
        deliveryDate={formData.deliveryDate}
        notes={formData.notes}
        total={total}
        taxAmount={taxAmount}
      />
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