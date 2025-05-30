import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { MessageSquare, Plus, Trash, Edit, Phone } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/components/vendor/types';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FULFILLMENT_TYPE_PICKUP, FULFILLMENT_TYPE_DELIVERY } from '@/types/order';

interface SendSMSDialogProps {
  orders: Order[];
  pickupLocations: string[];
}

export function SendSMSDialog({ orders, pickupLocations }: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Internal copy of all orders, unaffected by page filters
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  
  // Filter states - initialized with blank values
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [fulfillmentType, setFulfillmentType] = useState<string>('all');
  const [pickupLocation, setPickupLocation] = useState<string>('all');
  const [orderStatus, setOrderStatus] = useState<string>('all');
  
  // Phone numbers management
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Current filtered orders
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // When dialog opens, make a copy of all orders
  useEffect(() => {
    if (open) {
      setAllOrders([...orders]);
      resetFilters();
    }
  }, [open, orders]);

  // Function to normalize date for comparison
  const normalizeDateForComparison = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Apply filters and update filtered orders whenever filter states change
  useEffect(() => {
    if (!open) return;
    
    const newFilteredOrders = filterOrders();
    setFilteredOrders(newFilteredOrders);
    
    // Extract phone numbers from the filtered orders
    const extractedNumbers = Array.from(
      new Set(
        newFilteredOrders
          .map(order => order.customer?.phone || order.customer_phone)
          .filter(Boolean) as string[]
      )
    );
    setPhoneNumbers(extractedNumbers);
  }, [selectedDate, fulfillmentType, pickupLocation, orderStatus, allOrders, open]);

  // Filter orders based on selected filters
  const filterOrders = useCallback(() => {
    return allOrders.filter(order => {
      // Date filtering
      if (selectedDate) {
        const orderDate = new Date(order.delivery_date);
        const filterDate = selectedDate;
        
        const normalizedOrderDate = normalizeDateForComparison(orderDate);
        const normalizedFilterDate = normalizeDateForComparison(filterDate);
        
        if (normalizedOrderDate !== normalizedFilterDate) {
          return false;
        }
      }

      // Fulfillment type filtering
      if (fulfillmentType !== 'all' && order.fulfillment_type !== fulfillmentType) {
        return false;
      }

      // Pickup location filtering - only applied to pickup orders
      if (pickupLocation !== 'all') {
        if (order.fulfillment_type !== FULFILLMENT_TYPE_PICKUP) {
          return false;
        }
        if (order.pickup_location !== pickupLocation) {
          return false;
        }
      }

      // Order status filtering
      if (orderStatus !== 'all' && order.status !== orderStatus) {
        return false;
      }

      return true;
    });
  }, [allOrders, selectedDate, fulfillmentType, pickupLocation, orderStatus]);

  // Handle adding a new phone number
  const handleAddPhoneNumber = () => {
    if (!newPhoneNumber.trim()) return;
    
    // Avoid duplicates
    if (!phoneNumbers.includes(newPhoneNumber)) {
      setPhoneNumbers([...phoneNumbers, newPhoneNumber]);
    } else {
      toast({
        title: 'Duplicate Phone Number',
        description: 'This phone number already exists in the list',
        variant: 'destructive',
      });
    }
    setNewPhoneNumber('');
  };

  // Handle removing a phone number
  const handleRemovePhoneNumber = (index: number) => {
    const updatedNumbers = [...phoneNumbers];
    updatedNumbers.splice(index, 1);
    setPhoneNumbers(updatedNumbers);
  };

  // Handle editing a phone number
  const handleStartEditing = (index: number) => {
    setEditingIndex(index);
    setNewPhoneNumber(phoneNumbers[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !newPhoneNumber.trim()) return;
    
    const updatedNumbers = [...phoneNumbers];
    updatedNumbers[editingIndex] = newPhoneNumber;
    setPhoneNumbers(updatedNumbers);
    setNewPhoneNumber('');
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setNewPhoneNumber('');
    setEditingIndex(null);
  };

  // Handle sending SMS
  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }

    if (phoneNumbers.length === 0) {
      toast({
        title: 'No Recipients',
        description: 'There are no phone numbers to send SMS to',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumbers,
          message: `Ahram Kitchen: ${message}`
        }
      });

      if (error) throw error;

      toast({
        title: 'SMS Sent Successfully',
        description: `Message sent to ${phoneNumbers.length} customer(s)`,
      });
      
      setOpen(false);
      setMessage('');
    } catch (error: any) {
      toast({
        title: 'Failed to Send SMS',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset filters to blank state
  const resetFilters = () => {
    setSelectedDate(undefined);
    setFulfillmentType('all');
    setPickupLocation('all');
    setOrderStatus('all');
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <MessageSquare className="mr-2 h-4 w-4" />
        Send SMS to Customers
      </Button>
      
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        
        if (newOpen) {
          // Reset everything when dialog opens
          resetFilters();
          setMessage('');
          setNewPhoneNumber('');
          setEditingIndex(null);
        } else {
          // Clean up when dialog closes
          resetFilters();
          setMessage('');
          setNewPhoneNumber('');
          setEditingIndex(null);
          setPhoneNumbers([]);
          setAllOrders([]);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send SMS to Customers</DialogTitle>
            <DialogDescription>
              Filter customers and send an SMS to selected recipients
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fulfillment Date</Label>
                <DatePicker
                  date={selectedDate}
                  onSelect={handleDateSelect}
                  className="w-full"
                />
              </div>
              <div>
                <Label>Fulfillment Type</Label>
                <Select
                  value={fulfillmentType}
                  onValueChange={setFulfillmentType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value={FULFILLMENT_TYPE_PICKUP}>Pickup</SelectItem>
                    <SelectItem value={FULFILLMENT_TYPE_DELIVERY}>Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order Status</Label>
                <Select
                  value={orderStatus}
                  onValueChange={setOrderStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {fulfillmentType === FULFILLMENT_TYPE_PICKUP && (
                <div>
                  <Label>Pickup Location</Label>
                  <Select
                    value={pickupLocation}
                    onValueChange={setPickupLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {pickupLocations.map((location) => (
                        <SelectItem key={location || "unknown-location"} value={location || "unknown-location"}>
                          {location || "Unspecified location"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Phone Numbers ({phoneNumbers.length})</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const newFilteredOrders = filterOrders();
                    setFilteredOrders(newFilteredOrders);
                    const extractedNumbers = Array.from(
                      new Set(
                        newFilteredOrders
                          .map(order => order.customer?.phone || order.customer_phone)
                          .filter(Boolean) as string[]
                      )
                    );
                    setPhoneNumbers(extractedNumbers);
                  }}
                >
                  Refresh
                </Button>
              </div>
              
              <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 mb-3 bg-background">
                {phoneNumbers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-2">No phone numbers found with current filters</p>
                ) : (
                  <ul className="space-y-2">
                    {phoneNumbers.map((phone, index) => (
                      <li key={index} className="flex items-center justify-between gap-2 py-1 border-b last:border-b-0">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Button variant="ghost" size="sm" onClick={() => handleStartEditing(index)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemovePhoneNumber(index)}>
                            <Trash className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Input
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="Add phone number..."
                  className="flex-1"
                />
                {editingIndex !== null ? (
                  <>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleAddPhoneNumber}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendSMS}
              disabled={isLoading || !message.trim() || phoneNumbers.length === 0}
            >
              {isLoading ? 'Sending...' : `Send Message to ${phoneNumbers.length} Recipients`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
