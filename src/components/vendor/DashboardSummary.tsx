import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVendorOrders } from '@/hooks/useOrders';
import { useUnifiedOrders } from '@/hooks/useUnifiedOrders';
export function DashboardSummary() {
  const session = useSession();
  const {
    toast
  } = useToast();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  // Use admin orders hook for platform-wide access
  const {
    orders
  } = useVendorOrders();
  const unifiedOrderGroups = useUnifiedOrders(orders || []);

  // Filter unified orders based on date range
  const filteredUnifiedOrders = unifiedOrderGroups.filter(group => {
    const orderDate = new Date(group.unifiedOrder.createdAt);
    return orderDate >= dateRange.from && orderDate <= dateRange.to;
  });

  // Calculate stats based on unified orders
  const orderStats = {
    total: filteredUnifiedOrders.filter(group => group.unifiedOrder.overallStatus !== 'rejected').length,
    pending: filteredUnifiedOrders.filter(group => group.unifiedOrder.overallStatus === 'pending').length,
    completed: filteredUnifiedOrders.filter(group => group.unifiedOrder.overallStatus === 'completed').length,
    rejected: filteredUnifiedOrders.filter(group => group.unifiedOrder.overallStatus === 'rejected').length,
    revenue: filteredUnifiedOrders.filter(group => group.unifiedOrder.overallStatus !== 'rejected').reduce((sum, group) => sum + group.unifiedOrder.totalAmount, 0)
  };
  const handleQuickDateSelect = (filter: 'today' | 'week' | 'month' | 'custom') => {
    setTimeFilter(filter);

    // For custom selection, we now keep the current range instead of resetting
    if (filter === 'custom') {
      return;
    }
    const today = new Date();
    switch (filter) {
      case 'today':
        setDateRange({
          from: startOfDay(today),
          to: endOfDay(today)
        });
        break;
      case 'week':
        setDateRange({
          from: startOfDay(addDays(today, -7)),
          to: endOfDay(today)
        });
        break;
      case 'month':
        setDateRange({
          from: startOfDay(addDays(today, -30)),
          to: endOfDay(today)
        });
        break;
    }
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Overview</h2>
          <p className="text-muted-foreground">
        </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeFilter} onValueChange={(value: 'today' | 'week' | 'month' | 'custom') => handleQuickDateSelect(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange date={dateRange} onSelect={range => {
          if (range?.from) {
            // Always ensure there's a "to" date if we have a "from" date
            const to = range.to || range.from;
            if (timeFilter !== 'custom') {
              // Switch to custom mode when manually selecting dates
              setTimeFilter('custom');
            }
            setDateRange({
              from: startOfDay(range.from),
              to: endOfDay(to)
            });
          }
        }}
        // Mode is always range now that we've improved custom date selection
        mode="range" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Platform Orders</h3>
          <p className="text-2xl font-bold">{orderStats.total}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Orders</h3>
          <p className="text-2xl font-bold">{orderStats.pending}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Completed Orders</h3>
          <p className="text-2xl font-bold">{orderStats.completed}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Platform Revenue</h3>
          <p className="text-2xl font-bold">${orderStats.revenue.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Admin Access Notice</h3>
        <p className="text-sm text-muted-foreground">
      </p>
      </Card>
    </div>;
}