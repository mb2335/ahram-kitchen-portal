import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function VendorProfile() {
  const session = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    business_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (data) {
        setProfile({
          business_name: data.business_name,
          email: data.email,
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: profile.business_name,
          email: profile.email,
          phone: profile.phone,
        })
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Vendor Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Business Name
          </label>
          <Input
            value={profile.business_name}
            onChange={(e) =>
              setProfile({ ...profile, business_name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone
          </label>
          <Input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>
        <Button onClick={updateProfile}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}