
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import twilio from 'npm:twilio';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumbers, message } = await req.json()
    
    const client = twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN')
    );

    const results = await Promise.all(
      phoneNumbers.map(async (phone: string) => {
        try {
          const message_result = await client.messages.create({
            body: message,
            from: Deno.env.get('TWILIO_PHONE_NUMBER'),
            to: phone
          });
          return { success: true, phone, messageId: message_result.sid };
        } catch (error) {
          console.error(`Failed to send SMS to ${phone}:`, error);
          return { success: false, phone, error: error.message };
        }
      })
    );

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
