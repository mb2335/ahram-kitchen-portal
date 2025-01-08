import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    const payload = await req.json()
    console.log('Received order submission payload:', payload)

    // Verify pickup details in the payload
    if (payload.pickupDetails) {
      console.log('Pickup details found in payload:', payload.pickupDetails)
      
      // Attempt to create an order with pickup details
      const { data: order, error } = await supabase
        .from('orders')
        .insert([{
          customer_id: payload.customerId,
          total_amount: payload.total,
          tax_amount: payload.taxAmount,
          pickup_time: payload.pickupDetails.time,
          pickup_location: payload.pickupDetails.location,
          delivery_date: payload.deliveryDate,
          payment_proof_url: payload.paymentProofUrl,
          notes: payload.notes
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating order:', error)
        throw error
      }

      console.log('Order created successfully with pickup details:', order)
      return new Response(
        JSON.stringify({ success: true, order }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'No pickup details found in payload' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    console.error('Error processing order:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})