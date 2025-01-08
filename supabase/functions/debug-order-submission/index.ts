import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { items, total, taxAmount, notes, deliveryDates, customerData, pickupDetails } = await req.json()
    
    return new Response(
      JSON.stringify({ 
        message: 'Order submission data received',
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      },
    )
  }
})