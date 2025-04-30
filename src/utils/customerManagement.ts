
import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  fullName: string;
  email: string;
  phone?: string;
  smsOptIn?: boolean;
}

/**
 * For authenticated users: gets or creates a customer record
 * For guest users: returns null (no customer record created)
 */
export async function getOrCreateCustomer(customerData: CustomerData, userId?: string): Promise<string | null> {
  try {
    // Only create/update customer records for authenticated users
    if (userId) {
      // Check if customer exists for this user by user_id
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError && !fetchError.message.includes('No rows found')) {
        console.error('Error fetching customer by user_id:', fetchError);
        throw fetchError;
      }
      
      if (existingCustomer) {
        // Check if phone is being updated and if it's already used by someone else
        if (customerData.phone) {
          const { data: phoneCheck, error: phoneCheckError } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', customerData.phone)
            .neq('id', existingCustomer.id)
            .maybeSingle();
          
          if (phoneCheckError && !phoneCheckError.message.includes('No rows found')) {
            console.error('Error checking phone uniqueness:', phoneCheckError);
            throw phoneCheckError;
          }
          
          if (phoneCheck) {
            throw new Error('Phone number is already in use by another account');
          }
        }
        
        // Update existing customer data
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            full_name: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone || null,
            sms_opt_in: customerData.smsOptIn !== undefined ? customerData.smsOptIn : existingCustomer.sms_opt_in
          })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.error('Error updating customer:', updateError);
          throw updateError;
        }
        
        return existingCustomer.id;
      }
      
      // Before creating a new record, check if phone is already used
      if (customerData.phone) {
        const { data: phoneCheck, error: phoneCheckError } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customerData.phone)
          .maybeSingle();
        
        if (phoneCheckError && !phoneCheckError.message.includes('No rows found')) {
          console.error('Error checking phone uniqueness:', phoneCheckError);
          throw phoneCheckError;
        }
        
        if (phoneCheck) {
          throw new Error('Phone number is already in use by another account');
        }
      }
      
      // Check if email is already used
      const { data: emailCheck, error: emailCheckError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .maybeSingle();
      
      if (emailCheckError && !emailCheckError.message.includes('No rows found')) {
        console.error('Error checking email uniqueness:', emailCheckError);
        throw emailCheckError;
      }
      
      if (emailCheck) {
        throw new Error('Email is already in use by another account');
      }
      
      // Create a new customer record for the authenticated user
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
    
    // For guest checkout, don't create a customer record
    return null;
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    throw error;
  }
}
