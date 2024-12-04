import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { CartProvider } from "./contexts/CartContext";
import { Navigation } from "./components/Navigation";
import { Menu } from "./components/Menu";
import { Cart } from "./components/Cart";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
              </Routes>
            </div>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </CartProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;