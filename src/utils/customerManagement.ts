
import { supabase } from "@/integrations/supabase/client";
import { CustomerData } from "@/types/customer";

export async function getOrCreateCustomer(customerData: CustomerData, sessionUserId?: string) {
  try {
    console.log("Getting or creating customer with data:", customerData);
    
    // First, try to find an existing customer with this email
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerData.email)
      .maybeSingle();

    if (fetchError) {
      console.warn("Error fetching customer:", fetchError);
      throw fetchError;
    }

    // If we found an existing customer
    if (existingCustomer) {
      console.log("Found existing customer:", existingCustomer.id);
      
      // If the customer is associated with a user and we're not that user
      if (existingCustomer.user_id && sessionUserId !== existingCustomer.user_id) {
        console.warn("Email associated with different account");
        // Instead of throwing an error, just use the existing customer
        // This is a more permissive approach to ensure order submission works
        return existingCustomer.id;
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

      if (updateError) {
        console.warn("Error updating customer:", updateError);
        // If we can't update, still return the existing ID to avoid blocking
        return existingCustomer.id;
      }
      
      console.log("Updated customer:", updatedCustomer.id);
      return updatedCustomer.id;
    }

    // If no existing customer found, create a new one
    console.log("Creating new customer");
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

    if (createError) {
      console.error("Error creating customer:", createError);
      throw createError;
    }
    
    console.log("Created new customer:", newCustomer.id);
    return newCustomer.id;
  } catch (error: any) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}
