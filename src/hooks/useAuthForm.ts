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

    // Basic email validation
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

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: "Successfully signed in!",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      console.error('Detailed error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!validatePassword(formData.password)) return;
    
    setIsLoading(true);

    try {
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

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            user_type: 'customer',
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (error) {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email for verification.",
      });
      
    } catch (error: any) {
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