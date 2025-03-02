
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary } from './checkout/OrderSummary';
import { CheckoutForm } from './checkout/CheckoutForm';
import { CustomerForm } from './checkout/CustomerForm';
import { PickupDetail } from '@/types/pickup';
import { FULFILLMENT_TYPE_PICKUP } from '@/types/order';

const TAX_RATE = 0.1;

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const taxAmount = total * TAX_RATE;

  const [formData, setFormData] = useState({
    notes: '',
    deliveryDates: {} as Record<string, Date>,
    pickupDetail: null as PickupDetail | null
  });

  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Check if cart is empty and redirect if needed
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    
    // If user is logged in, load their data
    if (session?.user) {
      loadUserData();
    }
  }, [session, items, navigate]);

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
    navigate('/thank-you', {
      state: {
        orderDetails: {
          id: orderId,
          items: checkoutItems,
          subtotal: total - taxAmount,
          taxAmount: taxAmount,
          total: total,
          createdAt: new Date().toISOString(),
          pickupTime: formData.pickupDetail?.time || null,
          pickupLocation: formData.pickupDetail?.location || null,
          paymentProofUrl: null
        }
      },
      replace: true
    });
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

  const checkoutItems = items.map(item => ({
    id: item.id,
    name: item.name,
    nameKo: item.name_ko,
    quantity: item.quantity,
    price: item.price,
    category_id: item.category_id,
    discount_percentage: item.discount_percentage
  }));

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
          items={checkoutItems}
        />
      </div>
    </div>
  );
}
