
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
        // Update existing customer if smsOptIn has changed
        if (customerData.smsOptIn !== undefined && existingCustomer.sms_opt_in !== customerData.smsOptIn) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ 
              full_name: customerData.fullName,
              email: customerData.email,
              phone: customerData.phone,
              sms_opt_in: customerData.smsOptIn 
            })
            .eq('id', existingCustomer.id);
          
          if (updateError) {
            console.error('Error updating customer:', updateError);
            throw updateError;
          }
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
    // For guest checkout, check if a customer already exists with this email
    else {
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching guest customer:', fetchError);
        throw fetchError;
      }
      
      if (existingCustomer) {
        // Update existing customer if necessary
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            full_name: customerData.fullName,
            phone: customerData.phone || null,
            sms_opt_in: customerData.smsOptIn || false
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
