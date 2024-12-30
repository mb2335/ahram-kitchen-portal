import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SignInFormProps {
  onToggleForm: () => void;
}

export function SignInForm({ onToggleForm }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const validateForm = () => {
    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
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
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Successfully signed in!",
      });

    } catch (error: any) {
      let errorMessage = "Invalid email or password";
      
      if (error.message.includes("invalid_credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("email")) {
        errorMessage = "Please enter a valid email address";
      }
      
      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Detailed error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mt-1"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="mt-1"
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}