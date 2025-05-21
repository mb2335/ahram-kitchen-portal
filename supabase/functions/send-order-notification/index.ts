
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

// CORS headers to ensure the function can be called from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Parse webhook payload
    const payload = await req.json() as WebhookPayload;
    console.log("Received webhook payload:", payload);

    // Only process order events
    if (payload.table !== "orders") {
      return new Response(JSON.stringify({ message: "Not an order event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // NOTE: We've removed all email notification functionality
    // SMS notifications are now handled by the send-sms function
    
    return new Response(JSON.stringify({ success: true, message: "Order processed, SMS notifications handled separately" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
