
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OrderSummary } from './checkout/OrderSummary';
import { CheckoutForm } from './checkout/CheckoutForm';
import { CustomerForm } from './checkout/CustomerForm';
import { useLanguage } from '@/hooks/useLanguage';
import { useQuery } from '@tanstack/react-query';

const TAX_RATE = 0.1;

export function Checkout() {
  const { items, total, clearCart } = useCart();
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const taxAmount = total * TAX_RATE;

  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
    smsOptIn: false,
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isPreviouslyOptedIn, setIsPreviouslyOptedIn] = useState(false);
  const [showSmsWarning, setShowSmsWarning] = useState(false);

  // Fetch categories to include with items
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

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

  // Effect to check if a customer with the given phone number has previously opted in
  // This runs whenever the phone number changes
  useEffect(() => {
    if (!session && customerData.phone) {
      checkPhoneOptInStatus(customerData.phone);
    }
  }, [customerData.phone, session]);

  const checkPhoneOptInStatus = async (phone: string) => {
    if (!phone || phone.trim().length < 10) return; // Only check valid phone numbers
    
    try {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('sms_opt_in')
        .eq('phone', phone)
        .maybeSingle();
      
      if (existingCustomer) {
        setIsPreviouslyOptedIn(existingCustomer.sms_opt_in || false);
        
        // If they previously opted in, ensure smsOptIn is set to true
        if (existingCustomer.sms_opt_in) {
          setCustomerData(prev => ({
            ...prev,
            smsOptIn: true
          }));
        }
      } else {
        setIsPreviouslyOptedIn(false);
      }
    } catch (error) {
      console.error('Error checking phone opt-in status:', error);
    }
  };

  const loadUserData = async () => {
    setIsLoadingUserData(true);
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (customer) {
        setCustomerData({
          fullName: customer.full_name,
          email: customer.email,
          phone: customer.phone || '',
          smsOptIn: customer.sms_opt_in || false,
        });
        
        // Set previously opted in flag based on database value
        setIsPreviouslyOptedIn(customer.sms_opt_in || false);
      } else {
        // If no customer record exists for this user, set previously opted in to false
        setIsPreviouslyOptedIn(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleOrderSuccess = async (orderId: string, isAuthenticated: boolean) => {
    clearCart();

    // Get order details for the thank you page
    const orderDetails = {
      id: orderId,
      items: checkoutItems.map(item => {
        const category = categories.find(cat => cat.id === item.category_id);
        return {
          ...item,
          category: category ? {
            name: category.name,
            name_ko: category.name_ko
          } : undefined
        };
      }),
      subtotal: total - taxAmount,
      taxAmount: taxAmount,
      total: total,
      createdAt: new Date().toISOString(),
    };

    // Redirect to the appropriate page based on authentication status
    navigate('/thank-you', {
      state: { orderDetails },
      replace: true
    });

    // Show different toast messages based on authentication status
    if (isAuthenticated) {
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been confirmed. You can track its status in your order history.",
      });
    } else {
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been confirmed.",
      });
    }
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
      <h1 className="text-2xl font-bold mb-6">{t('checkout.title')}</h1>
      <div className="space-y-6">
        <OrderSummary />
        
        {/* Always render the CustomerForm but with different properties based on session */}
        <CustomerForm
          fullName={customerData.fullName}
          email={customerData.email}
          phone={customerData.phone}
          smsOptIn={customerData.smsOptIn}
          onFullNameChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
          onEmailChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
          onPhoneChange={(e) => {
            setCustomerData({ ...customerData, phone: e.target.value });
          }}
          onSmsOptInChange={(checked) => {
            setCustomerData({ ...customerData, smsOptIn: checked });
            setShowSmsWarning(false); // Hide warning when they check the box
          }}
          isPreviouslyOptedIn={isPreviouslyOptedIn}
          showSmsWarning={showSmsWarning}
          isReadOnly={!!session} // Make fields read-only for signed-in users
        />
        
        <CheckoutForm
          customerData={customerData}
          onOrderSuccess={handleOrderSuccess}
          total={total}
          taxAmount={taxAmount}
          items={checkoutItems}
          onSmsOptInRequired={() => setShowSmsWarning(true)}
        />
      </div>
    </div>
  );
}
