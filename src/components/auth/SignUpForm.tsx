import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SignUpFormProps {
  onToggleForm: () => void;
}

export function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
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

      if (error) throw error;

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

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onToggleForm}
          className="text-primary hover:underline"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}