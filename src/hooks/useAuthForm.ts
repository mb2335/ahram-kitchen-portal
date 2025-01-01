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
    if (!formData.email || !formData.password) {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!validatePassword(formData.password)) return;
    
    setIsLoading(true);
    console.log('Attempting sign up with:', { email: formData.email, fullName: formData.fullName });

    try {
      // First, check if a customer with this email already exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (existingCustomer) {
        toast({
          title: "Error",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
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
        // Create the customer profile
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          });

        if (customerError) throw customerError;
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
      
    } catch (error: any) {
      console.error('Error during sign up:', error);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
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