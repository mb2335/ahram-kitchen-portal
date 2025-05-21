
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from 'npm:twilio';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.31.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    
    // Handle different types of SMS notifications
    if (requestData.type === 'order_status_update') {
      return await handleOrderStatusUpdate(requestData);
    } else {
      // Original functionality for custom messages
      const { phoneNumbers, message } = requestData;
      return await sendCustomMessage(phoneNumbers, message);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Function to handle order status updates
async function handleOrderStatusUpdate(data) {
  try {
    const { order, previousStatus } = data;
    const customerPhone = order.customer_phone;
    const messages = [];
    
    // New order (pending) - send to all vendors with receive_notifications=true
    if (order.status === 'pending' && !previousStatus) {
      console.log('Processing new order notification');
      
      // Fetch vendors who should receive SMS notifications
      const { data: vendorsToNotify, error } = await supabase
        .from('vendors')
        .select('id, phone, business_name, vendor_name')
        .eq('receive_notifications', true)
        .not('phone', 'is', null);
      
      if (error) {
        console.error('Error fetching vendors for notification:', error);
      }
      else {
        console.log(`Found ${vendorsToNotify?.length || 0} vendors with notifications enabled`);
        
        if (vendorsToNotify && vendorsToNotify.length > 0) {
          // Send notification to each vendor with notifications enabled
          vendorsToNotify.forEach(vendor => {
            if (vendor.phone) {
              console.log(`Sending notification to vendor ${vendor.id} at ${vendor.phone}`);
              messages.push({
                to: vendor.phone,
                body: "A new order has been placed. Please review it in your dashboard."
              });
            }
          });
        } else {
          console.log('No vendors found with notifications enabled or with phone numbers');
        }
      }
      
      // Generate order summary for customer
      let orderSummary = "";
      if (order.order_items && order.order_items.length > 0) {
        // Create a formatted list of items with line breaks
        orderSummary = "\n" + order.order_items.map(item => 
          `- ${item.quantity}x ${item.menu_item?.name || 'Item'}`
        ).join("\n");
      } else {
        orderSummary = `Order #${order.id.substring(0, 8)}`;
      }
      
      // Message to customer if they have a phone number
      if (customerPhone) {
        messages.push({
          to: customerPhone,
          body: `Ahram Kitchen: Thank you for placing an order! Your order,${orderSummary}\nis currently pending.`
        });
      }
    }
    // Order confirmed
    else if (order.status === 'confirmed' && previousStatus === 'pending') {
      if (customerPhone) {
        messages.push({
          to: customerPhone,
          body: "Ahram Kitchen: Your order has been confirmed."
        });
      }
    }
    // Order rejected
    else if (order.status === 'rejected' && previousStatus === 'pending') {
      if (customerPhone) {
        const reason = order.rejection_reason || "no reason provided";
        messages.push({
          to: customerPhone,
          body: `Ahram Kitchen: Your order has been rejected due to ${reason}.`
        });
      }
    }
    // Order completed
    else if (order.status === 'completed' && previousStatus === 'confirmed') {
      if (customerPhone) {
        messages.push({
          to: customerPhone,
          body: "Ahram Kitchen: Your order has been marked complete."
        });
      }
    }

    // Send all messages
    if (messages.length > 0) {
      console.log(`Sending ${messages.length} message(s)`);
      const results = await sendMessages(messages);
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No messages to send for this order status update');
      return new Response(
        JSON.stringify({ success: true, message: "No notifications needed for this status change" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling order status update:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Function to send custom messages (original functionality)
async function sendCustomMessage(phoneNumbers, message) {
  try {
    const results = await sendMessages(
      phoneNumbers.map((phone) => ({
        to: phone,
        body: message
      }))
    );
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending custom message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Common function to send messages via Twilio
async function sendMessages(messages) {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  console.log(`Using Twilio configuration: Account SID ${twilioAccountSid ? 'present' : 'missing'}, Auth Token ${twilioAuthToken ? 'present' : 'missing'}, From Phone ${fromPhone || 'missing'}`);
  
  if (!twilioAccountSid || !twilioAuthToken || !fromPhone) {
    throw new Error('Missing Twilio configuration');
  }
  
  const client = twilio(twilioAccountSid, twilioAuthToken);
  
  const results = await Promise.all(
    messages.map(async (messageData) => {
      try {
        console.log(`Sending SMS to ${messageData.to}: ${messageData.body.substring(0, 30)}...`);
        const message = await client.messages.create({
          body: messageData.body,
          from: fromPhone,
          to: messageData.to
        });
        
        console.log(`Successfully sent message with SID: ${message.sid}`);
        return { 
          success: true, 
          phone: messageData.to, 
          messageId: message.sid 
        };
      } catch (error) {
        console.error(`Failed to send SMS to ${messageData.to}:`, error);
        return { 
          success: false, 
          phone: messageData.to, 
          error: error.message 
        };
      }
    })
  );
  
  return results;
}
