
// Edge Function: send-order-notification
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    customer_id?: string;
    customer_phone?: string;
    status: string;
    customer_name: string;
    customer_email: string;
  };
  schema: string;
  old_record: any;
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse webhook payload
    const payload = await req.json() as WebhookPayload;
    console.log("Received webhook payload:", payload);

    // Only process new orders or status changes
    if (payload.table !== "orders") {
      return new Response(JSON.stringify({ message: "Not an order event" }), {
        status: 200,
      });
    }

    const order = payload.record;
    const oldRecord = payload.old_record;
    
    // Check if this is a new order or status update
    const isNewOrder = payload.type === "INSERT";
    const isStatusChange = payload.type === "UPDATE" && oldRecord && order.status !== oldRecord.status;

    if (!isNewOrder && !isStatusChange) {
      return new Response(JSON.stringify({ message: "No notification needed" }), {
        status: 200,
      });
    }

    // Prepare message based on event type
    let message = "";
    if (isNewOrder) {
      message = `New order received from ${order.customer_name}. Order ID: ${order.id.substring(0, 8)}`;
    } else if (isStatusChange) {
      message = `Order ${order.id.substring(0, 8)} status updated to: ${order.status.toUpperCase()}`;
    }

    console.log("Sending notification:", message);

    // Send SMS if we have a phone number and SMS function URL
    if (order.customer_phone) {
      try {
        const smsResponse = await supabaseClient.functions.invoke("send-sms", {
          body: {
            phoneNumbers: [order.customer_phone],
            message: `Your order status has been updated to: ${order.status.toUpperCase()}. Thank you for your business!`
          }
        });
        
        console.log("SMS notification result:", smsResponse);
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Notifications sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
