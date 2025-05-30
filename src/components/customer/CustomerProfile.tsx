import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/shared/ErrorState';
import { useLanguage } from '@/hooks/useLanguage';

interface CustomerProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

export function CustomerProfile() {
  const { t } = useLanguage();
  const session = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!session) {
      navigate('/auth', { state: { returnTo: '/profile' } });
      return;
    }
    loadProfile();
  }, [session, navigate]);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile. Please try again.');
        return;
      }

      if (!data) {
        console.log('No profile found for user');
        setError('No profile found. Please create one.');
        return;
      }

      console.log('Loaded profile:', data);
      setProfile(data);
      setFormData({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || '',
      });
      setError(null);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      navigate('/auth');
      return;
    }
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
        })
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">{t('profile.page.title')}</h2>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('profile.fullName')}</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              disabled={updating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('profile.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={updating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('profile.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={updating}
            />
          </div>
          <Button type="submit" disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('profile.saving')}
              </>
            ) : (
              t('profile.save')
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
