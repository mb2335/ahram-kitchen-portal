
import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { MenuManagement } from './MenuManagement';
import { OrderManagement } from './OrderManagement';
import { VendorProfile } from './VendorProfile';
import { DashboardSummary } from './DashboardSummary';
import { PopularItemsChart } from './analytics/PopularItemsChart';
import { SmsNotifications } from './SmsNotifications';
import { cn } from "@/lib/utils";
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

export function VendorDashboard() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(`/vendor${path}`);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const renderLinks = () => {
    const links = [
      { path: '/summary', label: 'Overview' },
      { path: '/analytics', label: 'Analytics' },
      { path: '/menu', label: 'Menu Management' },
      { path: '/orders', label: 'Orders' },
      { path: '/notifications', label: 'SMS Notifications' },
      { path: '/profile', label: 'Profile' }
    ];

    return links.map(link => (
      <Link
        key={link.path}
        to={`/vendor${link.path}`}
        onClick={isMobile ? closeSidebar : undefined}
        className={cn(
          "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActiveRoute(link.path) 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted"
        )}
      >
        {link.label}
      </Link>
    ));
  };

  // Mobile sidebar
  if (isMobile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="mb-4 w-full">
                Vendor Dashboard Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%] max-w-xs">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Vendor Dashboard</h2>
                <Button variant="ghost" size="icon" onClick={closeSidebar} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="space-y-1">
                {renderLinks()}
              </nav>
            </SheetContent>
          </Sheet>
          
          <main className="min-h-[calc(100vh-8rem)]">
            <Routes>
              <Route path="summary" element={<DashboardSummary />} />
              <Route path="analytics" element={<PopularItemsChart />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="notifications" element={<SmsNotifications />} />
              <Route path="profile" element={<VendorProfile />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 space-y-2 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-semibold text-lg mb-4 px-3">Vendor Dashboard</h2>
          <nav className="space-y-1">
            {renderLinks()}
          </nav>
        </aside>
        <main className="flex-1 min-h-[calc(100vh-8rem)]">
          <Routes>
            <Route path="summary" element={<DashboardSummary />} />
            <Route path="analytics" element={<PopularItemsChart />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="notifications" element={<SmsNotifications />} />
            <Route path="profile" element={<VendorProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
