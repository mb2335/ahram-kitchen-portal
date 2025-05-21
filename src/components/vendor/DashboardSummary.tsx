
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardSummary() {
  const session = useSession();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats', timeFilter, dateRange],
    queryFn: async () => {
      try {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session?.user?.id)
          .single();

        if (!vendorData) throw new Error('Vendor not found');

        let timeQuery = supabase
          .from('orders')
          .select('status, total_amount')
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());

        const { data: orders, error } = await timeQuery;

        if (error) throw error;

        // Filter out rejected orders for total count and revenue calculations
        const validOrders = orders?.filter(o => o.status !== 'rejected') || [];
        
        const stats = {
          // Only count non-rejected orders for total
          total: validOrders.length || 0,
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0,
          rejected: orders?.filter(o => o.status === 'rejected').length || 0,
          // Only include revenue from non-rejected orders
          revenue: validOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        };

        return stats;
      } catch (error: any) {
        toast({
          title: 'Error fetching statistics',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: !!session?.user?.id,
  });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className="flex items-center gap-4">
          <Select
            value={timeFilter}
            onValueChange={(value: 'today' | 'week' | 'month' | 'custom') => handleQuickDateSelect(value)}
          >
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
          <DatePickerWithRange
            date={dateRange}
            onSelect={(range) => {
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
            mode="range"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
          <p className="text-2xl font-bold">{orderStats?.total || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Orders</h3>
          <p className="text-2xl font-bold">{orderStats?.pending || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Completed Orders</h3>
          <p className="text-2xl font-bold">{orderStats?.completed || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          <p className="text-2xl font-bold">${orderStats?.revenue.toFixed(2) || '0.00'}</p>
        </Card>
      </div>
    </div>
  );
}
