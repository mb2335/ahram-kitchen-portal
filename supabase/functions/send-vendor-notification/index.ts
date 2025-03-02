
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  message: string;
  sendMethod: 'email' | 'sms' | 'both';
  filters: {
    date?: string;
    pickupLocation?: string;
    fulfillmentType?: string;
    customerId?: string;
    orderId?: string;
  };
  vendorId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, sendMethod, filters, vendorId }: NotificationRequest = await req.json();
    console.log("Received notification request:", { message, sendMethod, filters, vendorId });

    // Insert the notification record
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        vendor_id: vendorId,
        message: message,
        send_method: sendMethod,
        filters: filters,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating notification:", insertError);
      throw new Error(`Error creating notification: ${insertError.message}`);
    }

    console.log("Created notification:", notification);

    // Find recipients based on filters
    let query = supabase
      .from("orders")
      .select(`
        id,
        customer_id,
        customer:customers(id, full_name, email, phone),
        delivery_date,
        pickup_location,
        fulfillment_type
      `);

    // Apply filters
    if (filters.date) {
      // Convert the date to match database format
      const filterDate = new Date(filters.date);
      const dateStr = filterDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Match against the delivery_date's date component
      query = query.filter('delivery_date', 'gte', `${dateStr}T00:00:00`);
      query = query.filter('delivery_date', 'lt', `${dateStr}T23:59:59`);
    }

    if (filters.pickupLocation) {
      query = query.eq('pickup_location', filters.pickupLocation);
    }

    if (filters.fulfillmentType) {
      query = query.eq('fulfillment_type', filters.fulfillmentType);
    }

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters.orderId) {
      query = query.eq('id', filters.orderId);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error("Error finding recipients:", ordersError);
      throw new Error(`Error finding recipients: ${ordersError.message}`);
    }

    console.log(`Found ${orders?.length || 0} matching orders for notification`);

    // Prepare recipients
    const recipients = [];
    const emailPromises = [];
    const smsPromises = [];

    // Map to track unique customers to avoid duplicate notifications
    const processedCustomers = new Set();

    for (const order of orders || []) {
      const customer = order.customer;
      
      // Skip if we've already processed this customer
      if (processedCustomers.has(customer.id)) continue;
      processedCustomers.add(customer.id);

      // Insert recipient record
      recipients.push({
        notification_id: notification.id,
        customer_id: customer.id,
        order_id: order.id,
        status: 'sent',
      });

      // Handle email notifications
      if (sendMethod === 'email' || sendMethod === 'both') {
        if (customer.email) {
          // In a real implementation, you would send an actual email here
          console.log(`Sending email to ${customer.email}: ${message}`);
          
          // Simulating email sending
          emailPromises.push(
            Promise.resolve({ 
              success: true, 
              recipient: customer.email 
            })
          );
        }
      }

      // Handle SMS notifications
      if (sendMethod === 'sms' || sendMethod === 'both') {
        if (customer.phone) {
          // In a real implementation, you would send an actual SMS here
          console.log(`Sending SMS to ${customer.phone}: ${message}`);
          
          // Simulating SMS sending
          smsPromises.push(
            Promise.resolve({ 
              success: true, 
              recipient: customer.phone 
            })
          );
        }
      }
    }

    // Wait for all notification sends to complete
    const emailResults = await Promise.all(emailPromises);
    const smsResults = await Promise.all(smsPromises);
    
    // Insert all recipient records
    if (recipients.length > 0) {
      const { error: recipientsError } = await supabase
        .from("notification_recipients")
        .insert(recipients);

      if (recipientsError) {
        console.error("Error recording recipients:", recipientsError);
        // Continue anyway since we've already sent notifications
      }
    }

    const result = {
      notification_id: notification.id,
      recipients_count: recipients.length,
      emails_sent: emailResults.length,
      sms_sent: smsResults.length,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders 
      },
    });
  } catch (error: any) {
    console.error("Error in send-vendor-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
