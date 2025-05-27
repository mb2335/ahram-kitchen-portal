
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
import { DollarSign, Package, Users, ShoppingCart } from 'lucide-react';
import { useVendorId } from '@/hooks/useVendorId';

type TimeRange = 'week' | 'month' | '6months' | 'year' | 'all';

const COLORS = ['#1F3A5F', '#9E4244', '#F5E6D3', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function PopularItemsChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { vendorId } = useVendorId();

  console.log('PopularItemsChart - vendorId:', vendorId);

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
  const { data: popularItems, isLoading: popularItemsLoading, error: popularItemsError } = useQuery({
    queryKey: ['popular-items', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) {
        console.log('No vendorId available for popular items query');
        return [];
      }
      
      console.log('Fetching popular items for vendor:', vendorId);
      const startDate = getStartDate();
      
      let query = supabase
        .from('order_items')
        .select(`
          quantity,
          menu_item_id,
          menu_item:menu_items!inner(
            id,
            name,
            vendor_id
          ),
          order:orders!inner(
            id,
            status,
            created_at
          )
        `)
        .eq('menu_item.vendor_id', vendorId)
        .neq('order.status', 'rejected');
        
      if (startDate) {
        query = query.gte('order.created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching popular items:', error);
        throw error;
      }

      console.log('Popular items raw data:', data);

      if (!data || data.length === 0) {
        console.log('No order items found');
        return [];
      }

      // Aggregate item quantities
      const aggregatedData = data.reduce((acc: any[], item) => {
        if (!item.menu_item) return acc;
        
        const existingItem = acc.find(i => i.name === item.menu_item.name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          acc.push({
            name: item.menu_item.name,
            quantity: item.quantity,
          });
        }
        return acc;
      }, []);

      const result = aggregatedData
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);
        
      console.log('Popular items result:', result);
      return result;
    },
    enabled: !!vendorId,
  });

  // Revenue Trends Data
  const { data: revenueTrends, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['revenue-trends', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) {
        console.log('No vendorId available for revenue trends query');
        return [];
      }
      
      console.log('Fetching revenue trends for vendor:', vendorId);
      const startDate = getStartDate();
      
      let query = supabase
        .from('orders')
        .select(`
          total_amount,
          created_at,
          status,
          order_items!inner(
            menu_item:menu_items!inner(vendor_id)
          )
        `)
        .eq('order_items.menu_item.vendor_id', vendorId)
        .neq('status', 'rejected');
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching revenue trends:', error);
        throw error;
      }

      console.log('Revenue trends raw data:', data);

      if (!data || data.length === 0) {
        console.log('No revenue data found');
        return [];
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
      const result = Object.values(groupedData)
        .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())
        .slice(-7)
        .map(({ dateObj, ...rest }: any) => rest);
        
      console.log('Revenue trends result:', result);
      return result;
    },
    enabled: !!vendorId,
  });

  // Order Status Distribution
  const { data: orderStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['order-status', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) {
        console.log('No vendorId available for order status query');
        return [];
      }
      
      console.log('Fetching order status for vendor:', vendorId);
      const startDate = getStartDate();
      
      let query = supabase
        .from('orders')
        .select(`
          status,
          order_items!inner(
            menu_item:menu_items!inner(vendor_id)
          )
        `)
        .eq('order_items.menu_item.vendor_id', vendorId);
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching order status:', error);
        throw error;
      }

      console.log('Order status raw data:', data);

      if (!data || data.length === 0) {
        console.log('No order status data found');
        return [];
      }

      const statusCounts = data.reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const result = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count as number,
      }));
      
      console.log('Order status result:', result);
      return result;
    },
    enabled: !!vendorId,
  });

  // Summary Stats including guest customers
  const { data: summaryStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['summary-stats', timeRange, vendorId],
    queryFn: async () => {
      if (!vendorId) {
        console.log('No vendorId available for summary stats query');
        return null;
      }
      
      console.log('Fetching summary stats for vendor:', vendorId);
      const startDate = getStartDate();
      
      let query = supabase
        .from('orders')
        .select(`
          total_amount,
          status,
          customer_id,
          customer_email,
          order_items!inner(
            menu_item:menu_items!inner(vendor_id)
          )
        `)
        .eq('order_items.menu_item.vendor_id', vendorId);
        
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching summary stats:', error);
        throw error;
      }

      console.log('Summary stats raw data:', data);

      if (!data || data.length === 0) {
        console.log('No summary stats data found');
        return {
          totalRevenue: 0,
          totalOrders: 0,
          uniqueCustomers: 0,
          averageOrderValue: 0,
        };
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

      const result = {
        totalRevenue,
        totalOrders,
        uniqueCustomers: uniqueCustomers.size,
        averageOrderValue,
      };
      
      console.log('Summary stats result:', result);
      return result;
    },
    enabled: !!vendorId,
  });

  const isLoading = popularItemsLoading || revenueLoading || statusLoading || statsLoading;
  const hasError = popularItemsError || revenueError || statusError || statsError;

  if (hasError) {
    console.error('Analytics errors:', { popularItemsError, revenueError, statusError, statsError });
  }

  if (!vendorId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No vendor ID found. Please ensure you are logged in as a vendor.</p>
        </div>
      </div>
    );
  }

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
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Debug Information */}
      {hasError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">Error loading analytics data. Check console for details.</p>
        </Card>
      )}

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
              ) : revenueTrends && revenueTrends.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No revenue data available</p>
                </div>
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
              ) : orderStatus && orderStatus.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No order status data available</p>
                </div>
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
            ) : popularItems && popularItems.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No popular items data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
}
