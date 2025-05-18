
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import { Help } from './pages/Help';
import { Navigation } from './components/Navigation';
import { Auth } from './components/Auth';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { OrderThankYou } from './components/OrderThankYou';
import { Menu } from './components/Menu';
import { OrderHistory } from './components/OrderHistory';
import { VendorDashboard } from './components/vendor/VendorDashboard';
import { VendorProfile } from './components/vendor/VendorProfile';
import { OrderManagement } from './components/vendor/OrderManagement';
import { CustomerProfile } from './components/customer/CustomerProfile';
import { MenuManagement } from './components/vendor/MenuManagement';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster";
import { MenuRealtimeProvider } from './contexts/MenuRealtimeContext';
import { useOrderQuantities } from './hooks/useOrderQuantities';

function App() {
  const { refetch: refetchOrderQuantities } = useOrderQuantities();

  return (
    <Router>
      <MenuRealtimeProvider refetchOrderQuantities={refetchOrderQuantities}>
        <div className="flex flex-col min-h-screen">
          <Navigation />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/help" element={<Help />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/thank-you" element={<OrderThankYou />} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
              <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
              <Route path="/vendor/profile" element={<ProtectedRoute><VendorProfile /></ProtectedRoute>} />
              <Route path="/vendor/orders" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />
              <Route path="/vendor/menu" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
        <Toaster />
      </MenuRealtimeProvider>
    </Router>
  );
}

export default App;
