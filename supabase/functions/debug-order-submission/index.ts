import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Debug order submission function started')

serve(async (req) => {
  try {
    const { items, total, taxAmount, notes, deliveryDates, customerData, pickupDetails } = await req.json()
    
    console.log('Received order submission request with data:', {
      items,
      total,
      taxAmount,
      notes,
      deliveryDates,
      customerData,
      pickupDetails
    })

    // Log pickup details specifically
    console.log('Pickup details:', pickupDetails)

    return new Response(
      JSON.stringify({ 
        message: 'Order submission data received and logged',
        data: {
          items,
          total,
          taxAmount,
          notes,
          deliveryDates,
          customerData,
          pickupDetails
        }
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    console.error('Error in debug-order-submission:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})