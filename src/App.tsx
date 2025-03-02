
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './contexts/CartContext';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { LanguageProvider } from './contexts/LanguageContext';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Auth } from './components/Auth';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderHistory } from './components/OrderHistory';
import { OrderThankYou } from './components/OrderThankYou';
import { Help } from './pages/Help';
import Index from './pages/Index';
import { ProtectedRoute } from './components/ProtectedRoute';
import { VendorDashboard } from './components/vendor/VendorDashboard';
import { Toaster } from './components/ui/toaster';
import { Navigation } from './components/Navigation';
import { supabase } from './integrations/supabase/client';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <LanguageProvider>
          <TooltipProvider>
            <CartProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <Navigation />
                  <div className="relative pt-16 pb-10">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/help" element={<Help />} />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <OrderHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/order-confirmation/:orderId" element={<OrderThankYou />} />
                      <Route
                        path="/vendor/*"
                        element={
                          <ProtectedRoute requiredRole="vendor">
                            <VendorDashboard />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </div>
                  <Toaster />
                </div>
              </BrowserRouter>
            </CartProvider>
          </TooltipProvider>
        </LanguageProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  );
}

export default App;
