
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export function useAuthForm(isSignUp: boolean) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateForm = () => {
    if (!formData.email || (!isSignUp && !formData.password)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Check if email and/or phone is already in use
  const checkForDuplicates = async () => {
    const checks = [];
    
    // Check for duplicate email
    checks.push(
      supabase
        .from('customers')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle()
    );
    
    // Check for duplicate phone if provided
    if (formData.phone && formData.phone.trim()) {
      checks.push(
        supabase
          .from('customers')
          .select('id')
          .eq('phone', formData.phone)
          .maybeSingle()
      );
    }
    
    const [emailResult, phoneResult] = await Promise.all(checks);
    
    if (emailResult.data) {
      toast({
        title: "Email already in use",
        description: "This email address is already registered. Please sign in instead.",
        variant: "destructive",
      });
      return false;
    }
    
    if (phoneResult?.data) {
      toast({
        title: "Phone number already in use",
        description: "This phone number is already registered with another account.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    console.log('Attempting sign in with:', { email: formData.email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (error) {
        console.error('Sign in error:', error);
        
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and verify your account before signing in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: "The email or password you entered is incorrect. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
      }

    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const linkCustomerRecordToUser = async (userId: string, email: string, fullName?: string, phone?: string) => {
    try {
      console.log('Checking for existing customer record with email:', email);
      
      // First, try to find an existing customer record with this email that has no user_id
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .is('user_id', null)
        .maybeSingle();
      
      if (findError) {
        console.error('Error checking for existing customer:', findError);
        return false;
      }
      
      if (existingCustomer) {
        console.log('Found existing customer record, updating with user_id:', existingCustomer.id);
        
        // Update the existing customer record with the user_id
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            user_id: userId,
            full_name: fullName || existingCustomer.full_name,
            phone: phone || existingCustomer.phone
          })
          .eq('id', existingCustomer.id);
        
        if (updateError) {
          console.error('Error updating existing customer record:', updateError);
          return false;
        }
        
        console.log('Successfully linked customer record to user account');
        return true;
      } else {
        console.log('No existing customer record found, creating new one');
        
        // If no existing customer record, create a new one
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            full_name: fullName || '',
            email: email,
            phone: phone || null
          });
        
        if (insertError) {
          console.error('Error creating customer record:', insertError);
          return false;
        }
        
        console.log('Successfully created new customer record');
        return true;
      }
    } catch (error: any) {
      console.error('Error in linkCustomerRecordToUser:', error);
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!validatePassword(formData.password)) return;
    
    setIsLoading(true);
    console.log('Attempting sign up with:', { email: formData.email, fullName: formData.fullName });

    try {
      // First check for duplicate email or phone
      const isUnique = await checkForDuplicates();
      if (!isUnique) {
        setIsLoading(false);
        return;
      }
      
      // Sign up the user with metadata
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Link or create customer record for this user
        const success = await linkCustomerRecordToUser(
          user.id,
          formData.email,
          formData.fullName,
          formData.phone
        );
        
        if (!success) {
          console.warn('Note: Customer profile creation/linking failed, but user was created successfully');
        }
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
      
    } catch (error: any) {
      console.error('Error during sign up:', error);
      
      // Handle specific error for duplicate email
      if (error.message.includes('unique constraint') || error.message.includes('already exists')) {
        toast({
          title: "Email already in use",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    formData,
    passwordError,
    setFormData,
    validatePassword,
    handleSignIn: isSignUp ? undefined : handleSignIn,
    handleSignUp: isSignUp ? handleSignUp : undefined,
  };
}
