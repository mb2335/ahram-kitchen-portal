import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Navigation } from "./components/Navigation";
import { Menu } from "./components/Menu";
import { Cart } from "./components/Cart";
import { Auth } from "./components/Auth";
import { VendorDashboard } from "./components/vendor/VendorDashboard";
import { CustomerProfile } from "./components/customer/CustomerProfile";
import { Checkout } from "./components/Checkout";
import { OrderHistory } from "./components/OrderHistory";
import { OrderThankYou } from "./components/checkout/OrderThankYou";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { StrictMode } from "react";

const queryClient = new QueryClient();

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <LanguageProvider>
          <TooltipProvider>
            <CartProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-gray-50">
                  <Navigation />
                  <Routes>
                    <Route path="/" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/thank-you" element={<OrderThankYou />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/profile" element={<CustomerProfile />} />
                    <Route path="/auth" element={<Auth />} />
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
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </CartProvider>
          </TooltipProvider>
        </LanguageProvider>
      </SessionContextProvider>
    </QueryClientProvider>
  </StrictMode>
);

export default App;