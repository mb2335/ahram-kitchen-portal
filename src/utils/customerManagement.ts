import { supabase } from "@/integrations/supabase/client";
import { CustomerData } from "@/types/customer";

export async function getOrCreateCustomer(customerData: CustomerData, sessionUserId?: string) {
  try {
    // First, try to find an existing customer with this email
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerData.email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // If we found an existing customer
    if (existingCustomer) {
      // If the customer is associated with a user and we're not that user
      if (existingCustomer.user_id && sessionUserId !== existingCustomer.user_id) {
        throw new Error('This email is associated with an existing account. Please sign in.');
      }
      
      // Update the existing customer's information
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          full_name: customerData.fullName,
          phone: customerData.phone,
          // Only update user_id if we have a session and the customer doesn't already have one
          ...(sessionUserId && !existingCustomer.user_id ? { user_id: sessionUserId } : {})
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedCustomer.id;
    }

    // If no existing customer found, create a new one
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone,
        user_id: sessionUserId || null
      })
      .select()
      .single();

    if (createError) throw createError;
    return newCustomer.id;
  } catch (error: any) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}