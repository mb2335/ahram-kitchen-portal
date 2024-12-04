import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { MenuManagement } from './MenuManagement';
import { OrderManagement } from './OrderManagement';
import { Announcements } from './Announcements';
import { VendorProfile } from './VendorProfile';

export function VendorDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 space-y-2">
          <Link
            to="/vendor/menu"
            className="block p-3 rounded hover:bg-gray-100 transition-colors"
          >
            Menu Management
          </Link>
          <Link
            to="/vendor/orders"
            className="block p-3 rounded hover:bg-gray-100 transition-colors"
          >
            Orders
          </Link>
          <Link
            to="/vendor/announcements"
            className="block p-3 rounded hover:bg-gray-100 transition-colors"
          >
            Announcements
          </Link>
          <Link
            to="/vendor/profile"
            className="block p-3 rounded hover:bg-gray-100 transition-colors"
          >
            Profile
          </Link>
        </aside>
        <main className="flex-1">
          <Routes>
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<VendorProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}