
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useVendorProfile } from '../../../hooks/useVendorProfile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';
import { CalendarIcon, SearchIcon, SendIcon, UserIcon, XCircleIcon } from 'lucide-react';
import { NotificationFormData } from '@/types/notification';

export function VendorNotifications() {
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<NotificationFormData>({
    defaultValues: {
      message: '',
      sendMethod: 'email',
      fulfillmentType: '',
    }
  });
  
  const { toast } = useToast();
  const { vendorData } = useVendorProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [pickupLocations, setPickupLocations] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const message = watch('message');
  const searchQuery = watch('searchQuery', '');
  
  // Fetch pickup locations on load
  useEffect(() => {
    async function fetchPickupLocations() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('pickup_location')
          .not('pickup_location', 'is', null)
          .order('pickup_location', { ascending: true });
        
        if (error) throw error;
        
        // Extract unique pickup locations
        const uniqueLocations = [...new Set(
          data
            .map(order => order.pickup_location)
            .filter(Boolean)
        )];
        
        setPickupLocations(uniqueLocations);
      } catch (error) {
        console.error('Error fetching pickup locations:', error);
      }
    }
    
    fetchPickupLocations();
  }, []);
  
  // Fetch notification history
  useEffect(() => {
    async function fetchNotificationHistory() {
      if (!vendorData?.id) return;
      
      try {
        setHistoryLoading(true);
        
        // Since we're now using JOIN syntax with the clients for Supabase v2,
        // we need to adjust our query to use the correct approach
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            message,
            send_method,
            created_at,
            filters
          `)
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;

        // For each notification, fetch recipients
        const notificationsWithRecipients = await Promise.all(
          data.map(async (notification) => {
            const { data: recipients, error: recipientsError } = await supabase
              .from('notification_recipients')
              .select(`
                id,
                customer:customer_id(full_name, email, phone)
              `)
              .eq('notification_id', notification.id);
            
            if (recipientsError) {
              console.error('Error fetching recipients:', recipientsError);
              return { ...notification, recipients: [] };
            }
            
            return { ...notification, recipients };
          })
        );
        
        setNotificationHistory(notificationsWithRecipients);
      } catch (error) {
        console.error('Error fetching notification history:', error);
        toast({
          variant: 'destructive',
          title: 'Error fetching notification history',
          description: 'Please try again later.',
        });
      } finally {
        setHistoryLoading(false);
      }
    }
    
    fetchNotificationHistory();
  }, [vendorData?.id, toast]);
  
  // Handle customer/order search
  useEffect(() => {
    async function performSearch() {
      if (!searchQuery || searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsSearching(true);
        
        // Search for customers and orders that match the query
        const { data: customers, error: customerError } = await supabase
          .from('customers')
          .select('id, full_name, email, phone')
          .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5);
        
        if (customerError) throw customerError;
        
        const { data: orders, error: orderError } = await supabase
          .from('orders')
          .select(`
            id, 
            total_amount,
            delivery_date,
            status,
            customer_id
          `)
          .or(`id.eq.${searchQuery},id.ilike.${searchQuery}`)
          .limit(5);
        
        if (orderError) throw orderError;
        
        // Fetch customer details for orders
        const ordersWithCustomers = await Promise.all(
          orders.map(async (order) => {
            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .select('id, full_name, email, phone')
              .eq('id', order.customer_id)
              .single();
            
            if (customerError) {
              console.error('Error fetching customer:', customerError);
              return { ...order, customer: null };
            }
            
            return { ...order, customer };
          })
        );
        
        // Combine results
        const results = [
          ...customers.map(customer => ({ type: 'customer', data: customer })),
          ...ordersWithCustomers
            .filter(order => order.customer)
            .map(order => ({ type: 'order', data: order }))
        ];
        
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching for recipients:', error);
      } finally {
        setIsSearching(false);
      }
    }
    
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const selectRecipient = (item: any) => {
    if (item.type === 'customer') {
      setSelectedCustomer(item.data);
      setSelectedOrder(null);
    } else if (item.type === 'order') {
      setSelectedOrder(item.data);
      setSelectedCustomer(item.data.customer);
    }
    
    setSearchResults([]);
  };
  
  const clearSelectedRecipient = () => {
    setSelectedCustomer(null);
    setSelectedOrder(null);
  };
  
  const onSubmit = async (data: NotificationFormData) => {
    if (!vendorData?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Vendor profile not found. Please try again later.',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare the filters based on the selected tab/criteria
      const filters: any = {};
      
      // For bulk notifications
      if (data.date) {
        filters.date = format(data.date, 'yyyy-MM-dd');
      }
      
      if (data.pickupLocation) {
        filters.pickupLocation = data.pickupLocation;
      }
      
      if (data.fulfillmentType) {
        filters.fulfillmentType = data.fulfillmentType;
      }
      
      // For individual notifications
      if (selectedCustomer) {
        filters.customerId = selectedCustomer.id;
      }
      
      if (selectedOrder) {
        filters.orderId = selectedOrder.id;
      }
      
      // Call the edge function to send the notification
      const response = await supabase.functions.invoke('send-vendor-notification', {
        body: {
          message: data.message,
          sendMethod: data.sendMethod,
          filters,
          vendorId: vendorData.id,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const result = response.data;
      
      toast({
        title: 'Notification sent',
        description: `Sent to ${result.recipients_count} recipients (${result.emails_sent} emails, ${result.sms_sent} SMS)`,
      });
      
      // Reset the form
      reset();
      setSelectedCustomer(null);
      setSelectedOrder(null);
      
      // Refresh notification history
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          message,
          send_method,
          created_at,
          filters
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!notificationsError && notificationsData) {
        // For each notification, fetch recipients
        const notificationsWithRecipients = await Promise.all(
          notificationsData.map(async (notification) => {
            const { data: recipients, error: recipientsError } = await supabase
              .from('notification_recipients')
              .select(`
                id,
                customer:customer_id(full_name, email, phone)
              `)
              .eq('notification_id', notification.id);
            
            if (recipientsError) {
              console.error('Error fetching recipients:', recipientsError);
              return { ...notification, recipients: [] };
            }
            
            return { ...notification, recipients };
          })
        );
        
        setNotificationHistory(notificationsWithRecipients);
      }
      
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        variant: 'destructive',
        title: 'Error sending notification',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Customer Notifications</h2>
      
      <Tabs defaultValue="bulk" className="w-full">
        <TabsList>
          <TabsTrigger value="bulk">Bulk Notifications</TabsTrigger>
          <TabsTrigger value="individual">Individual Notifications</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bulk" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Notification</CardTitle>
              <CardDescription>
                Send notifications to customers based on delivery date, pickup location, etc.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date (optional)</Label>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setValue('date', undefined);
                        }}
                        className="mr-2"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </Button>
                      <DatePickerWithRange
                        date={{ from: watch('date'), to: watch('date') }}
                        onSelect={(range) => setValue('date', range?.from)}
                        mode="single"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fulfillment Type (optional)</Label>
                    <Select 
                      value={watch('fulfillmentType') || ''} 
                      onValueChange={(value) => setValue('fulfillmentType', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fulfillment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All types</SelectItem>
                        <SelectItem value={FULFILLMENT_TYPE_PICKUP}>Pickup</SelectItem>
                        <SelectItem value={FULFILLMENT_TYPE_DELIVERY}>Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {watch('fulfillmentType') === FULFILLMENT_TYPE_PICKUP && (
                    <div className="space-y-2">
                      <Label>Pickup Location (optional)</Label>
                      <Select
                        value={watch('pickupLocation') || ''}
                        onValueChange={(value) => setValue('pickupLocation', value || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pickup location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All locations</SelectItem>
                          {pickupLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Send Via</Label>
                  <RadioGroup 
                    value={watch('sendMethod')} 
                    onValueChange={(value) => setValue('sendMethod', value as 'email' | 'sms' | 'both')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="radio-email" />
                      <Label htmlFor="radio-email">Email only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="radio-sms" />
                      <Label htmlFor="radio-sms">SMS only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="radio-both" />
                      <Label htmlFor="radio-both">Both Email & SMS</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your notification message here..."
                    className="h-32"
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters long'
                      }
                    })}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>
                
                {message && (
                  <Card className="bg-muted">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Message Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{message}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Notification'}
                  <SendIcon className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="individual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Individual Notification</CardTitle>
              <CardDescription>
                Send a notification to a specific customer or order.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search for Customer or Order</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search by name, email, or order ID..."
                      {...register('searchQuery')}
                      className="pl-10"
                    />
                    <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {isSearching && (
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 bg-white shadow-lg rounded-md p-2 w-full max-h-60 overflow-y-auto border">
                      {searchResults.map((item, idx) => (
                        <div
                          key={`${item.type}-${idx}`}
                          className="p-2 hover:bg-accent rounded-md cursor-pointer"
                          onClick={() => selectRecipient(item)}
                        >
                          {item.type === 'customer' ? (
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2" />
                              <div>
                                <p className="font-medium">{item.data.full_name}</p>
                                <p className="text-sm text-muted-foreground">{item.data.email}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              <div>
                                <p className="font-medium">Order #{item.data.id.substring(0, 8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.data.customer?.full_name} - ${item.data.total_amount}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedCustomer && (
                  <Card className="bg-muted">
                    <CardHeader className="py-2 flex flex-row justify-between items-center">
                      <CardTitle className="text-sm">Selected Recipient</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearSelectedRecipient}
                        className="h-6 w-6 p-0"
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="py-2">
                      <p className="font-medium">{selectedCustomer.full_name}</p>
                      <p className="text-sm">{selectedCustomer.email}</p>
                      {selectedCustomer.phone && (
                        <p className="text-sm">{selectedCustomer.phone}</p>
                      )}
                      {selectedOrder && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm">
                            Order #{selectedOrder.id.substring(0, 8)} - ${selectedOrder.total_amount}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                  <Label>Send Via</Label>
                  <RadioGroup 
                    value={watch('sendMethod')} 
                    onValueChange={(value) => setValue('sendMethod', value as 'email' | 'sms' | 'both')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="individual-radio-email" />
                      <Label htmlFor="individual-radio-email">Email only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sms" id="individual-radio-sms" />
                      <Label htmlFor="individual-radio-sms">SMS only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="individual-radio-both" />
                      <Label htmlFor="individual-radio-both">Both Email & SMS</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your notification message here..."
                    className="h-32"
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters long'
                      }
                    })}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message.message}</p>
                  )}
                </div>
                
                {message && (
                  <Card className="bg-muted">
                    <CardHeader className="py-2">
                      <CardTitle className="text-sm">Message Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{message}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading || !selectedCustomer}
                >
                  {isLoading ? 'Sending...' : 'Send Notification'}
                  <SendIcon className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View past notifications sent to customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <p className="text-center py-4">Loading notification history...</p>
              ) : notificationHistory.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No notifications sent yet.</p>
              ) : (
                <div className="space-y-4">
                  {notificationHistory.map((notification) => (
                    <Card key={notification.id} className="bg-muted">
                      <CardHeader className="py-3">
                        <div className="flex flex-col md:flex-row justify-between gap-2">
                          <CardTitle className="text-base">
                            {new Date(notification.created_at).toLocaleString()}
                          </CardTitle>
                          <div className="flex space-x-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {notification.send_method === 'both'
                                ? 'Email & SMS'
                                : notification.send_method === 'email'
                                ? 'Email'
                                : 'SMS'}
                            </span>
                            <span className="text-xs bg-muted-foreground/10 text-muted-foreground px-2 py-1 rounded-full">
                              {notification.recipients?.length || 0} recipients
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-0">
                        <p className="whitespace-pre-wrap">{notification.message}</p>
                        {notification.filters && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>Filters:</p>
                            <ul className="list-disc pl-5">
                              {notification.filters.date && (
                                <li>Date: {notification.filters.date}</li>
                              )}
                              {notification.filters.pickupLocation && (
                                <li>Pickup Location: {notification.filters.pickupLocation}</li>
                              )}
                              {notification.filters.fulfillmentType && (
                                <li>
                                  Fulfillment Type: {
                                    notification.filters.fulfillmentType === FULFILLMENT_TYPE_PICKUP
                                      ? 'Pickup'
                                      : 'Delivery'
                                  }
                                </li>
                              )}
                              {notification.filters.customerId && (
                                <li>Sent to specific customer</li>
                              )}
                              {notification.filters.orderId && (
                                <li>Sent for specific order</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
