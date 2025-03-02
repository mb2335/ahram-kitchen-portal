import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { MenuManagement } from './MenuManagement';
import { OrderManagement } from './OrderManagement';
import { VendorProfile } from './VendorProfile';
import { DashboardSummary } from './DashboardSummary';
import { PopularItemsChart } from './analytics/PopularItemsChart';
import { cn } from "@/lib/utils";

export function VendorDashboard() {
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(`/vendor${path}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 space-y-2 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-lg mb-4 px-3">Vendor Dashboard</h2>
          <nav className="space-y-1">
            <Link
              to="/vendor/summary"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActiveRoute('/summary') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              Overview
            </Link>
            <Link
              to="/vendor/analytics"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActiveRoute('/analytics') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              Analytics
            </Link>
            <Link
              to="/vendor/menu"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActiveRoute('/menu') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              Menu Management
            </Link>
            <Link
              to="/vendor/orders"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActiveRoute('/orders') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              Orders
            </Link>
            <Link
              to="/vendor/profile"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActiveRoute('/profile') 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              Profile
            </Link>
          </nav>
        </aside>
        <main className="flex-1 min-h-[calc(100vh-8rem)]">
          <Routes>
            <Route path="summary" element={<DashboardSummary />} />
            <Route path="analytics" element={<PopularItemsChart />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="profile" element={<VendorProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}