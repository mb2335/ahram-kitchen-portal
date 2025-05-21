
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";

// Type definitions
interface VendorNotification {
  id: string;
  business_name: string;
  phone: string;
  receive_notifications: boolean;
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
          .select('id, business_name, phone, receive_notifications')
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
      // Update all vendors: set receive_notifications=true for selected vendors
      // and receive_notifications=false for unselected vendors
      
      // First, set all vendors to not receive notifications
      const { error: resetError } = await supabase
        .from('vendors')
        .update({ receive_notifications: false })
        .neq('id', 'dummy'); // Update all rows
      
      if (resetError) throw resetError;
      
      // Then, set selected vendors to receive notifications
      if (data.vendorIds.length > 0) {
        const { error: updateError } = await supabase
          .from('vendors')
          .update({ receive_notifications: true })
          .in('id', data.vendorIds);
        
        if (updateError) throw updateError;
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
                  <div className="space-y-4">
                    {vendors.length === 0 && !isLoading ? (
                      <p className="text-sm text-gray-500">No vendor accounts found.</p>
                    ) : (
                      vendors.map((vendor) => (
                        <FormField
                          key={vendor.id}
                          control={form.control}
                          name="vendorIds"
                          render={({ field }) => (
                            <FormItem
                              key={vendor.id}
                              className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"
                            >
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
                                />
                              </FormControl>
                              <div className="flex-1 space-y-1">
                                <FormLabel className="text-sm font-medium leading-none">
                                  {vendor.business_name}
                                </FormLabel>
                                <p className="text-sm text-gray-500">
                                  {vendor.phone || "No phone number"}
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
