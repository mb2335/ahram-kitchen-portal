
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from 'npm:twilio';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Vendor phone number as a constant for easier management
const VENDOR_PHONE = '425-553-5355';

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
    
    // Don't proceed if customer has no phone number
    if (!customerPhone) {
      return new Response(
        JSON.stringify({ success: false, message: "No customer phone number provided" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate order summary for new orders
    let orderSummary = "";
    if (order.status === 'pending' && !previousStatus) {
      if (order.order_items && order.order_items.length > 0) {
        // Create a formatted list of items with line breaks
        orderSummary = "\n" + order.order_items.map(item => 
          `- ${item.quantity}x ${item.menu_item?.name || 'Item'}`
        ).join("\n");
      } else {
        orderSummary = `Order #${order.id.substring(0, 8)}`;
      }
    }

    // Determine messages to send based on order status
    const messages = [];
    
    // New order (pending)
    if (order.status === 'pending' && !previousStatus) {
      // Message to vendor
      messages.push({
        to: VENDOR_PHONE,
        body: "A new order has been placed. Please review it in your dashboard."
      });
      
      // Message to customer
      messages.push({
        to: customerPhone,
        body: `Ahram Kitchen: Thank you for placing an order! Your order,${orderSummary}\nis currently pending.`
      });
    }
    // Order confirmed
    else if (order.status === 'confirmed' && previousStatus === 'pending') {
      messages.push({
        to: customerPhone,
        body: "Ahram Kitchen: Your order has been confirmed."
      });
    }
    // Order rejected
    else if (order.status === 'rejected' && previousStatus === 'pending') {
      const reason = order.rejection_reason || "no reason provided";
      messages.push({
        to: customerPhone,
        body: `Ahram Kitchen: Your order has been rejected due to ${reason}.`
      });
    }
    // Order completed
    else if (order.status === 'completed' && previousStatus === 'confirmed') {
      messages.push({
        to: customerPhone,
        body: "Ahram Kitchen: Your order has been marked complete."
      });
    }

    // Send all messages
    if (messages.length > 0) {
      const results = await sendMessages(messages);
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
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
  const client = twilio(
    Deno.env.get('TWILIO_ACCOUNT_SID'),
    Deno.env.get('TWILIO_AUTH_TOKEN')
  );
  
  const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  const results = await Promise.all(
    messages.map(async (messageData) => {
      try {
        const message = await client.messages.create({
          body: messageData.body,
          from: fromPhone,
          to: messageData.to
        });
        
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
