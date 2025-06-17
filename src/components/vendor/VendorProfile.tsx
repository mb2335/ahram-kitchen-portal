
import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface VendorProfile {
  id: string;
  business_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

export function VendorProfile() {
  const session = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [allVendors, setAllVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
    loadAllVendors();
  }, []);

  async function loadProfile() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', session?.user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        business_name: data.business_name,
        email: data.email,
        phone: data.phone || '',
      });
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

  async function loadAllVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('business_name');

      if (error) throw error;
      setAllVendors(data || []);
    } catch (error) {
      console.error('Error loading all vendors:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: formData.business_name,
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
      loadAllVendors(); // Refresh all vendors list
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Profile & Platform Overview</h2>
        <p className="text-muted-foreground">
          As a platform admin, you have shared access to all vendor settings and configurations.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Admin Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Platform Admins</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All vendors have equal admin access to platform settings.
          </p>
          <div className="space-y-2">
            {allVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium">{vendor.business_name}</div>
                  <div className="text-sm text-muted-foreground">{vendor.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {vendor.id === profile?.id && (
                    <Badge variant="default">You</Badge>
                  )}
                  <Badge variant={vendor.is_active ? "secondary" : "destructive"}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
