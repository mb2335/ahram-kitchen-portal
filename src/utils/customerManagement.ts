import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  fullName: string;
  email: string;
  phone?: string;
  smsOptIn?: boolean;
}

export async function getOrCreateCustomer(customerData: CustomerData, userId?: string): Promise<string> {
  try {
    // If user is logged in, get or create customer linked to this user
    if (userId) {
      // Check if customer exists for this user
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching customer:', fetchError);
        throw fetchError;
      }
      
      if (existingCustomer) {
        // Update existing customer - preserve opt-in status if it's true in either the database or the current form
        // This ensures we never accidentally "un-opt-in" someone who was previously opted in
        const updatedSmsOptIn = customerData.smsOptIn || existingCustomer.sms_opt_in || false;
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone || null,
            sms_opt_in: updatedSmsOptIn
          })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.error('Error updating customer:', updateError);
          throw updateError;
        }
        
        return existingCustomer.id;
      }
      
      // If no customer exists for this user, create one
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          full_name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone || null,
          sms_opt_in: customerData.smsOptIn || false
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating customer:', insertError);
        throw insertError;
      }
      
      return newCustomer.id;
    } 
    // For guest checkout, check if a customer already exists with this email or phone
    else {
      let existingCustomer = null;
      
      // First try to find by email
      const { data: customerByEmail, error: emailFetchError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('email', customerData.email)
        .maybeSingle();
      
      if (emailFetchError) {
        console.error('Error fetching customer by email:', emailFetchError);
      }
      
      // Then try to find by phone if provided
      let customerByPhone = null;
      if (customerData.phone) {
        const { data: phoneCustomer, error: phoneFetchError } = await supabase
          .from('customers')
          .select('id, sms_opt_in')
          .eq('phone', customerData.phone)
          .maybeSingle();
        
        if (phoneFetchError) {
          console.error('Error fetching customer by phone:', phoneFetchError);
        } else {
          customerByPhone = phoneCustomer;
        }
      }
      
      // Prioritize phone match over email match for SMS opt-in status
      existingCustomer = customerByPhone || customerByEmail;
      
      if (existingCustomer) {
        // Update existing customer - important to preserve their SMS opt-in status
        // We want the most permissive option (if they've ever opted in, keep it that way)
        const updatedSmsOptIn = customerData.smsOptIn || existingCustomer.sms_opt_in || false;
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone || null,
            sms_opt_in: updatedSmsOptIn
          })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.error('Error updating guest customer:', updateError);
          throw updateError;
        }
        
        return existingCustomer.id;
      }
      
      // Create a new customer record
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          full_name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone || null,
          sms_opt_in: customerData.smsOptIn || false
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating guest customer:', insertError);
        throw insertError;
      }
      
      return newCustomer.id;
    }
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}
