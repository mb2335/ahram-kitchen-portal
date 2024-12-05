import { supabase } from "@/integrations/supabase/client";

interface CustomerData {
  fullName: string;
  email: string;
  phone: string | null;
}

export async function createGuestCustomer(customerData: CustomerData) {
  console.log('Creating guest customer with data:', customerData);
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone || null,
        user_id: null // Explicitly set as null for guest users
      })
      .select('id')
      .single();

    if (customerError) {
      console.error('Error creating guest customer:', customerError);
      throw customerError;
    }
    
    console.log('Guest customer created successfully:', customer);
    return customer.id;
  } catch (error) {
    console.error('Caught error while creating guest customer:', error);
    throw error;
  }
}

export async function getOrCreateCustomer(session: any, customerData?: CustomerData) {
  console.log('Getting or creating customer. Session:', !!session, 'Customer data:', !!customerData);
  
  if (!session?.user && !customerData) {
    throw new Error('No customer data provided for guest checkout');
  }

  try {
    if (session?.user) {
      console.log('Fetching existing customer for user:', session.user.id);
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing customer:', fetchError);
        throw fetchError;
      }

      if (existingCustomer) {
        console.log('Found existing customer:', existingCustomer);
        return existingCustomer.id;
      }

      console.log('Creating new customer for authenticated user');
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          user_id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || 'Unknown',
          phone: session.user.user_metadata?.phone || null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating new customer:', insertError);
        throw insertError;
      }
      
      console.log('Created new customer:', newCustomer);
      return newCustomer.id;
    }

    // Guest checkout
    return createGuestCustomer(customerData!);
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}