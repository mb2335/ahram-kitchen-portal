import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('[Debug] Edge function loaded and running');

serve(async (req) => {
  console.log('[Debug] Received request:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('[Debug] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('[Debug] Processing request body');
    const payload = await req.json();
    console.log('[Debug] Request payload:', JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Debug] Missing environment variables');
      throw new Error('Missing environment variables');
    }

    console.log('[Debug] Creating Supabase client');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify pickup details in the payload
    if (payload.pickupDetails) {
      console.log('[Debug] Pickup details found:', JSON.stringify(payload.pickupDetails, null, 2));
      
      // Log the exact order data being inserted
      const orderData = {
        customer_id: payload.customerId,
        total_amount: payload.total,
        tax_amount: payload.taxAmount,
        pickup_time: payload.pickupDetails.time,
        pickup_location: payload.pickupDetails.location,
        delivery_date: payload.deliveryDate,
        payment_proof_url: payload.paymentProofUrl,
        notes: payload.notes
      };
      
      console.log('[Debug] Attempting to insert order with data:', JSON.stringify(orderData, null, 2));

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('[Debug] Error creating order:', error);
        throw error;
      }

      console.log('[Debug] Order created successfully:', JSON.stringify(order, null, 2));
      return new Response(
        JSON.stringify({ success: true, order }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Debug] No pickup details found in payload');
    return new Response(
      JSON.stringify({ error: 'No pickup details found in payload' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    console.error('[Debug] Error processing order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})