import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays, subMonths, subYears, startOfDay } from 'date-fns';

type TimeRange = 'week' | 'month' | '6months' | 'year' | 'all';

export function PopularItemsChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return startOfDay(subDays(now, 7));
      case 'month':
        return startOfDay(subMonths(now, 1));
      case '6months':
        return startOfDay(subMonths(now, 6));
      case 'year':
        return startOfDay(subYears(now, 1));
      case 'all':
        return null;
    }
  };

  const { data: popularItems, isLoading } = useQuery({
    queryKey: ['popular-items', timeRange],
    queryFn: async () => {
      const startDate = getStartDate();
      let query = supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item:menu_items(
            name,
            name_ko
          )
        `)
        .order('quantity', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate quantities by menu item
      const aggregatedData = data.reduce((acc: any[], item) => {
        const existingItem = acc.find(i => i.name === item.menu_item?.name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else if (item.menu_item) {
          acc.push({
            name: item.menu_item.name,
            quantity: item.quantity,
          });
        }
        return acc;
      }, []);

      // Sort by quantity and take top 10
      return aggregatedData
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
  });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Popular Items</h3>
        <Select
          value={timeRange}
          onValueChange={(value: TimeRange) => setTimeRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-[400px] w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={popularItems}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}