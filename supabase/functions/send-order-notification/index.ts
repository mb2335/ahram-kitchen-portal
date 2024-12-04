import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!)
    const { orderId } = await req.json()

    // Fetch order details with customer information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers (
          full_name,
          email
        ),
        order_items (
          quantity,
          unit_price,
          menu_item:menu_items (
            name,
            name_ko
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Send email to customer
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'orders@yourdomain.com',
        to: [order.customer.email],
        subject: `Order Confirmation #${order.id.slice(0, 8)}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Thank you for your order, ${order.customer.full_name}!</p>
          <p>Order #: ${order.id.slice(0, 8)}</p>
          <h2>Order Details:</h2>
          <ul>
            ${order.order_items.map(item => `
              <li>${item.quantity}x ${item.menu_item.name} - $${(item.quantity * item.unit_price).toFixed(2)}</li>
            `).join('')}
          </ul>
          <p>Subtotal: $${(order.total_amount - order.tax_amount).toFixed(2)}</p>
          <p>Tax: $${order.tax_amount.toFixed(2)}</p>
          <p>Total: $${order.total_amount.toFixed(2)}</p>
          <p>Delivery Date: ${new Date(order.delivery_date).toLocaleDateString()}</p>
          ${order.notes ? `<p>Special Instructions: ${order.notes}</p>` : ''}
        `,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error('Failed to send email notification')
    }

    return new Response(
      JSON.stringify({ message: 'Notifications sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})