
import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  fullName: string;
  email: string;
  phone?: string;
  smsOptIn?: boolean;
}

export async function getOrCreateCustomer(customerData: CustomerData, userId?: string): Promise<string> {
  try {
    // If user is logged in, handle customer record for authenticated user
    if (userId) {
      // Check if customer exists for this user by user_id
      const { data: existingCustomerByUserId, error: fetchUserIdError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchUserIdError && !fetchUserIdError.message.includes('No rows found')) {
        console.error('Error fetching customer by user_id:', fetchUserIdError);
        throw fetchUserIdError;
      }
      
      if (existingCustomerByUserId) {
        // Check if phone is being updated and if it's already used by someone else
        if (customerData.phone) {
          const { data: phoneCheck, error: phoneCheckError } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', customerData.phone)
            .neq('id', existingCustomerByUserId.id)
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
            sms_opt_in: customerData.smsOptIn !== undefined ? customerData.smsOptIn : existingCustomerByUserId.sms_opt_in
          })
          .eq('id', existingCustomerByUserId.id);
        
        if (updateError) {
          console.error('Error updating customer:', updateError);
          throw updateError;
        }
        
        return existingCustomerByUserId.id;
      }
      
      // If no customer exists for this user by user_id, check by email
      // This helps handle case where they previously checked out as guest with same email
      const { data: existingCustomerByEmail, error: fetchEmailError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('email', customerData.email)
        .is('user_id', null)
        .maybeSingle();
        
      if (fetchEmailError && !fetchEmailError.message.includes('No rows found')) {
        console.error('Error fetching customer by email:', fetchEmailError);
      }
      
      if (existingCustomerByEmail) {
        // Check if phone is provided and if it's already used by someone else
        if (customerData.phone) {
          const { data: phoneCheck, error: phoneCheckError } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', customerData.phone)
            .neq('id', existingCustomerByEmail.id)
            .maybeSingle();
          
          if (phoneCheckError && !phoneCheckError.message.includes('No rows found')) {
            console.error('Error checking phone uniqueness:', phoneCheckError);
            throw phoneCheckError;
          }
          
          if (phoneCheck) {
            throw new Error('Phone number is already in use by another account');
          }
        }
        
        // Update the existing guest customer record to link it to this user
        const { error: linkError } = await supabase
          .from('customers')
          .update({
            user_id: userId,
            full_name: customerData.fullName,
            phone: customerData.phone || null,
            sms_opt_in: customerData.smsOptIn !== undefined ? customerData.smsOptIn : existingCustomerByEmail.sms_opt_in
          })
          .eq('id', existingCustomerByEmail.id);
        
        if (linkError) {
          console.error('Error linking guest customer to user:', linkError);
          throw linkError;
        }
        
        return existingCustomerByEmail.id;
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
      
      // If no customer exists at all for this user, create one
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
    // Handle guest checkout
    else {
      // Check if a customer already exists with this email
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, sms_opt_in')
        .eq('email', customerData.email)
        .maybeSingle();
      
      if (fetchError && !fetchError.message.includes('No rows found')) {
        console.error('Error fetching customer by email:', fetchError);
        throw fetchError;
      }
      
      // If customer exists with this email, update their details
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
        
        // Don't change user_id if it exists - preserve the link to a user account
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            full_name: customerData.fullName,
            phone: customerData.phone || null,
            sms_opt_in: customerData.smsOptIn !== undefined ? customerData.smsOptIn : existingCustomer.sms_opt_in
          })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.error('Error updating guest customer:', updateError);
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
      
      // Create a new customer record for guest
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
