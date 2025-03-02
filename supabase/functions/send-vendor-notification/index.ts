import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

serve(async (req: Request) => {
  try {
    // Create a Supabase client with the auth context of the requesting user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const authResponse = await supabaseClient.auth.getUser();
    if (authResponse.error) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the request body
    const requestData: NotificationRequest = await req.json();
    const { message, sendMethod, filters, vendorId } = requestData;

    // Validate the request data
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!vendorId) {
      return new Response(JSON.stringify({ error: "Vendor ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!['email', 'sms', 'both'].includes(sendMethod)) {
      return new Response(JSON.stringify({ error: "Invalid send method" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 1: Find recipients based on filters
    let recipients: any[] = [];

    // If we have a specific customer or order ID, fetch just that customer
    if (filters.customerId || filters.orderId) {
      const query = supabaseClient.from('customers').select('id, full_name, email, phone');
      
      if (filters.customerId) {
        query.eq('id', filters.customerId);
      } else if (filters.orderId) {
        const { data: order } = await supabaseClient
          .from('orders')
          .select('customer_id')
          .eq('id', filters.orderId)
          .single();
        
        if (order && order.customer_id) {
          query.eq('id', order.customer_id);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      recipients = data || [];
    } else {
      // Otherwise, find recipients based on filters like date, location, etc.
      let query = supabaseClient
        .from('orders')
        .select('id, customer_id, customers(id, full_name, email, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.date) {
        // Format the date as ISO string and search for orders on that date
        const dateStr = filters.date;
        const startDate = new Date(dateStr + 'T00:00:00Z');
        const endDate = new Date(dateStr + 'T23:59:59Z');
        
        query = query
          .gte('delivery_date', startDate.toISOString())
          .lte('delivery_date', endDate.toISOString());
      }

      if (filters.pickupLocation) {
        query = query.eq('pickup_location', filters.pickupLocation);
      }

      if (filters.fulfillmentType) {
        query = query.eq('fulfillment_type', filters.fulfillmentType);
      }

      const { data: orders, error } = await query;

      if (error) {
        throw error;
      }

      // Extract unique customers from the orders
      const customerMap = new Map();
      
      orders?.forEach(order => {
        if (order.customers && !customerMap.has(order.customers.id)) {
          customerMap.set(order.customers.id, {
            id: order.customers.id,
            full_name: order.customers.full_name,
            email: order.customers.email,
            phone: order.customers.phone,
            order_id: order.id
          });
        }
      });
      
      recipients = Array.from(customerMap.values());
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No matching recipients found",
        recipients_count: 0,
        emails_sent: 0,
        sms_sent: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Store the notification in the database
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        vendor_id: vendorId,
        message: message,
        send_method: sendMethod,
        filters: filters,
      })
      .select()
      .single();

    if (notificationError) {
      throw notificationError;
    }

    // Step 3: Create notification recipients
    const recipientRecords = recipients.map(recipient => ({
      notification_id: notification.id,
      customer_id: recipient.id,
      order_id: recipient.order_id || null,
      status: 'sent'
    }));

    const { error: recipientsError } = await supabaseClient
      .from('notification_recipients')
      .insert(recipientRecords);

    if (recipientsError) {
      throw recipientsError;
    }

    // Step 4: Send the notifications (email/SMS)
    // In a real implementation, you would integrate with email and SMS services here
    // For now, we'll just simulate sending

    let emailsSent = 0;
    let smsSent = 0;

    // Count emails and SMS that would be sent
    if (sendMethod === 'email' || sendMethod === 'both') {
      emailsSent = recipients.filter(r => r.email).length;
    }

    if (sendMethod === 'sms' || sendMethod === 'both') {
      smsSent = recipients.filter(r => r.phone).length;
    }

    // Return success response
    return new Response(JSON.stringify({
      message: "Notification sent successfully",
      recipients_count: recipients.length,
      emails_sent: emailsSent,
      sms_sent: smsSent,
      notification_id: notification.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
