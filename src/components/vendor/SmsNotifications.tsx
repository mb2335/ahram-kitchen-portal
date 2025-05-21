
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useVendorId } from "@/hooks/useVendorId";
import { Phone, Mail, Store } from "lucide-react";

// Type definitions
interface VendorNotification {
  id: string;
  business_name: string;
  vendor_name: string | null;
  phone: string | null;
  receive_notifications: boolean;
  email: string;
}

// Schema for form validation
const formSchema = z.object({
  vendorIds: z.array(z.string())
});

type FormValues = z.infer<typeof formSchema>;

export function SmsNotifications() {
  const [vendors, setVendors] = useState<VendorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { vendorId } = useVendorId();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorIds: []
    }
  });

  // Fetch vendors and their notification settings
  useEffect(() => {
    async function fetchVendors() {
      setIsLoading(true);
      
      try {
        // Get all vendors with their notification settings
        const { data, error } = await supabase
          .from('vendors')
          .select('id, business_name, vendor_name, phone, email, receive_notifications')
          .order('business_name');
          
        if (error) throw error;
        
        setVendors(data || []);
        
        // Set form default values based on vendors who already receive notifications
        const notifiedVendors = (data || [])
          .filter(vendor => vendor.receive_notifications)
          .map(vendor => vendor.id);
          
        form.setValue('vendorIds', notifiedVendors);
      } catch (error: any) {
        console.error('Error fetching vendors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load vendor notification settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVendors();
  }, [toast, form]);
  
  // Save notification settings
  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    
    try {
      // Fix: Update vendors one by one instead of using a single update with neq.dummy
      
      // Create a map of which vendors should receive notifications
      const receivesNotifications = new Map<string, boolean>();
      vendors.forEach(vendor => {
        receivesNotifications.set(vendor.id, data.vendorIds.includes(vendor.id));
      });
      
      // Update each vendor individually
      for (const vendor of vendors) {
        const shouldReceiveNotifications = receivesNotifications.get(vendor.id) || false;
        
        // Only update if the setting has changed
        if (vendor.receive_notifications !== shouldReceiveNotifications) {
          const { error } = await supabase
            .from('vendors')
            .update({ receive_notifications: shouldReceiveNotifications })
            .eq('id', vendor.id);
          
          if (error) throw error;
        }
      }
      
      // Update local state to reflect changes
      setVendors(prevVendors => prevVendors.map(vendor => ({
        ...vendor,
        receive_notifications: data.vendorIds.includes(vendor.id)
      })));
      
      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Helper function to display vendor name (use vendor_name if available, otherwise business_name)
  const getDisplayName = (vendor: VendorNotification): string => {
    return vendor.vendor_name || vendor.business_name;
  };

  // Helper to highlight the current vendor
  const isCurrentVendor = (id: string): boolean => {
    return id === vendorId;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">SMS Notifications</h2>
      </div>
      
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Manage Order Notifications</h3>
          <p className="text-sm text-gray-500">
            Select which vendors should receive SMS notifications when new orders are placed.
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendorIds"
              render={() => (
                <FormItem>
                  {vendors.length === 0 && !isLoading ? (
                    <p className="text-sm text-gray-500">No vendor accounts found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Notify</TableHead>
                            <TableHead>Vendor Information</TableHead>
                            <TableHead>Contact Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vendors.map((vendor) => (
                            <TableRow key={vendor.id} className={isCurrentVendor(vendor.id) ? "bg-muted/30" : ""}>
                              <TableCell>
                                <FormField
                                  key={vendor.id}
                                  control={form.control}
                                  name="vendorIds"
                                  render={({ field }) => (
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(vendor.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, vendor.id]);
                                          } else {
                                            field.onChange(
                                              field.value?.filter(
                                                (id) => id !== vendor.id
                                              )
                                            );
                                          }
                                        }}
                                        disabled={!vendor.phone}
                                      />
                                    </FormControl>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    <Store className="h-4 w-4 text-muted-foreground" />
                                    {getDisplayName(vendor)}
                                    {isCurrentVendor(vendor.id) && (
                                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">{vendor.business_name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {vendor.phone ? (
                                      vendor.phone
                                    ) : (
                                      <span className="text-gray-400 italic">No phone number</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    {vendor.email}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {vendors.filter(v => !v.phone).length > 0 && (
                  <p>Vendors without phone numbers cannot receive SMS notifications.</p>
                )}
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
