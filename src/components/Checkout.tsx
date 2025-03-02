
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from './ui/use-toast';
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
    pickupDetail: null as PickupDetail | null,
    fulfillmentType: '' as string,
  });

  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  // Fetch categories and set default dates
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    
    // Set default delivery dates for all categories
    const setDefaultDates = async () => {
      const { data: categories } = await supabase
        .from('menu_categories')
        .select('*');
      
      if (!categories) return;
      
      const defaultDates: Record<string, Date> = {};
      const today = new Date();
      
      // Get all unique category IDs from items
      const categoryIds = items
        .map(item => item.category_id)
        .filter((id, index, self) => id && self.indexOf(id) === index) as string[];
      
      // Set a default date for each category
      categoryIds.forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          // Check if it has pickup days
          if (category.pickup_days && category.pickup_days.length > 0) {
            const dayOfWeek = today.getDay();
            const isPickupDay = category.pickup_days.includes(dayOfWeek);
            
            // If today is a pickup day and we want a delivery date, 
            // find the next non-pickup day
            if (isPickupDay && category.fulfillment_types?.includes('delivery')) {
              let nextDeliveryDate = new Date(today);
              
              // Find the next day that isn't a pickup day
              for (let i = 1; i <= 7; i++) {
                const nextDate = new Date(today);
                nextDate.setDate(today.getDate() + i);
                const nextDayOfWeek = nextDate.getDay();
                
                if (!category.pickup_days.includes(nextDayOfWeek)) {
                  nextDeliveryDate = nextDate;
                  break;
                }
              }
              
              defaultDates[categoryId] = nextDeliveryDate;
            } 
            // For pickup, use today if it's a pickup day, otherwise next pickup day
            else if (category.fulfillment_types?.includes('pickup')) {
              let nextPickupDate = new Date(today);
              
              if (!isPickupDay) {
                // Find the next pickup day
                const sortedPickupDays = [...category.pickup_days].sort((a, b) => {
                  const daysUntilA = (a - dayOfWeek + 7) % 7;
                  const daysUntilB = (b - dayOfWeek + 7) % 7;
                  return daysUntilA - daysUntilB;
                });
                
                const nextDay = sortedPickupDays[0];
                const daysToAdd = (nextDay - dayOfWeek + 7) % 7;
                
                if (daysToAdd > 0) {
                  nextPickupDate = new Date(today);
                  nextPickupDate.setDate(today.getDate() + daysToAdd);
                }
              }
              
              defaultDates[categoryId] = nextPickupDate;
            }
            // Default case - use today's date
            else {
              defaultDates[categoryId] = today;
            }
          } else {
            // No pickup days defined, just use today
            defaultDates[categoryId] = today;
          }
        }
      });
      
      if (Object.keys(defaultDates).length > 0) {
        setFormData(prev => ({
          ...prev,
          deliveryDates: {
            ...prev.deliveryDates,
            ...defaultDates
          }
        }));
      }
    };
    
    setDefaultDates();
    
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
          paymentProofUrl: null,
          fulfillmentType: formData.fulfillmentType
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

  // Find the unified pickup date (using the first category's date as reference)
  const getUnifiedPickupDate = () => {
    if (formData.fulfillmentType !== FULFILLMENT_TYPE_PICKUP || Object.keys(formData.deliveryDates).length === 0) {
      return undefined;
    }
    
    // Just take the first date from the deliveryDates object
    const firstCategoryId = Object.keys(formData.deliveryDates)[0];
    return formData.deliveryDates[firstCategoryId];
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="space-y-6">
        <OrderSummary 
          taxAmount={taxAmount}
          pickupDate={getUnifiedPickupDate()}
          pickupDetail={formData.pickupDetail}
          fulfillmentType={formData.fulfillmentType}
        />
        
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
