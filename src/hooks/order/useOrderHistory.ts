import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { useOrders } from '../useOrders';

export function useOrderHistory() {
  const session = useSession();
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();

  useEffect(() => {
    if (!session) {
      navigate('/auth', { state: { returnTo: '/orders' } });
    }
  }, [session, navigate]);

  return {
    orders,
    isLoading,
    isAuthenticated: !!session
  };
}