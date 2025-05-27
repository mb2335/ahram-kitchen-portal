
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays, subMonths, subYears, startOfDay, format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { useVendorId } from '@/hooks/useVendorId';

type TimeRange = 'week' | 'month' | '6months' | 'year' | 'all';

const COLORS = ['#1F3A5F', '#9E4244', '#F5E6D3', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function PopularItemsChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { vendorId } = useVendorId();

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

  // Popular Items Data
  const { data: popularItems, isLoading: popularItemsLoading } = useQuery({
    queryKey: ['popular-items', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const startDate = getStartDate();
      
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          order_items!inner(
            quantity,
            menu_item_id,
            menu_items!inner(
              name,
              vendor_id
            )
          )
        `)
        .neq('status', 'rejected')
        .eq('order_items.menu_items.vendor_id', vendorId);
        
      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }
      
      const { data: orders, error } = await ordersQuery;
      
      if (error) {
        console.error('Error fetching popular items:', error);
        throw error;
      }
      if (!orders || orders.length === 0) return [];

      // Aggregate item quantities
      const aggregatedData = orders.reduce((acc: any[], order) => {
        order.order_items.forEach((item: any) => {
          if (!item.menu_items) return;
          const existingItem = acc.find(i => i.name === item.menu_items.name);
          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            acc.push({
              name: item.menu_items.name,
              quantity: item.quantity,
            });
          }
        });
        return acc;
      }, []);

      return aggregatedData
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
    },
    enabled: !!vendorId,
  });

  // Revenue Trends Data
  const { data: revenueTrends, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-trends', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const startDate = getStartDate();
      
      // Get orders with items from this vendor
      let query = supabase
        .from('orders')
        .select(`
          total_amount,
          created_at,
          order_items!inner(
            menu_items!inner(vendor_id)
          )
        `)
        .neq('status', 'rejected')
        .eq('order_items.menu_items.vendor_id', vendorId);
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching revenue trends:', error);
        throw error;
      }

      // Group by date and sort chronologically
      const groupedData = data.reduce((acc: any, order) => {
        const date = format(new Date(order.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { 
            date, 
            revenue: 0, 
            orders: 0,
            dateObj: new Date(order.created_at)
          };
        }
        acc[date].revenue += Number(order.total_amount);
        acc[date].orders += 1;
        return acc;
      }, {});

      // Sort by actual date and return last 7 data points
      return Object.values(groupedData)
        .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())
        .slice(-7)
        .map(({ dateObj, ...rest }: any) => rest);
    },
    enabled: !!vendorId,
  });

  // Order Status Distribution
  const { data: orderStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['order-status', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const startDate = getStartDate();
      
      let query = supabase
        .from('orders')
        .select(`
          status,
          order_items!inner(
            menu_items!inner(vendor_id)
          )
        `)
        .eq('order_items.menu_items.vendor_id', vendorId);
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching order status:', error);
        throw error;
      }

      const statusCounts = data.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count as number,
      }));
    },
    enabled: !!vendorId,
  });

  // Summary Stats including guest customers
  const { data: summaryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['summary-stats', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const startDate = getStartDate();
      
      let query = supabase
        .from('orders')
        .select(`
          total_amount,
          status,
          customer_id,
          customer_email,
          order_items!inner(
            menu_items!inner(vendor_id)
          )
        `)
        .eq('order_items.menu_items.vendor_id', vendorId);
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching summary stats:', error);
        throw error;
      }

      const validOrders = data.filter(order => order.status !== 'rejected');
      
      const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const totalOrders = validOrders.length;
      
      // Count unique customers including guests (by email if no customer_id)
      const uniqueCustomers = new Set();
      validOrders.forEach(order => {
        if (order.customer_id) {
          uniqueCustomers.add(order.customer_id);
        } else if (order.customer_email) {
          uniqueCustomers.add(order.customer_email);
        }
      });
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalOrders,
        uniqueCustomers: uniqueCustomers.size,
        averageOrderValue,
      };
    },
    enabled: !!vendorId,
  });

  const isLoading = popularItemsLoading || revenueLoading || statusLoading || statsLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
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

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Revenue</p>
              <p className="text-3xl font-bold text-blue-900">
                ${summaryStats?.totalRevenue.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Orders</p>
              <p className="text-3xl font-bold text-green-900">
                {summaryStats?.totalOrders || 0}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Unique Customers</p>
              <p className="text-3xl font-bold text-purple-900">
                {summaryStats?.uniqueCustomers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-orange-900">
                ${summaryStats?.averageOrderValue.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-semibold">Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1F3A5F" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1F3A5F" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1F3A5F"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-xl font-semibold">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items Chart */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-semibold">Popular Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="h-[400px] w-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading data...</p>
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
                  <Bar dataKey="quantity" fill="#1F3A5F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
