import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
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
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  const { data: orderStats } = useQuery({
    queryKey: ['order-stats', timeFilter],
    queryFn: async () => {
      try {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session?.user?.id)
          .single();

        if (!vendorData) throw new Error('Vendor not found');

        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, total_amount')
          .gte('created_at', getTimeFilterDate(timeFilter));

        if (error) throw error;

        const stats = {
          total: orders?.length || 0,
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0,
          rejected: orders?.filter(o => o.status === 'rejected').length || 0,
          revenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
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

  function getTimeFilterDate(filter: string) {
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        const lastWeek = new Date(now.setDate(now.getDate() - 7));
        return lastWeek.toISOString();
      case 'month':
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
        return lastMonth.toISOString();
      default:
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Select
          value={timeFilter}
          onValueChange={(value: 'today' | 'week' | 'month') => setTimeFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
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