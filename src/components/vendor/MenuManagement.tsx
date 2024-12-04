import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export function MenuManagement() {
  const session = useSession();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenuItems();
  }, []);

  async function loadMenuItems() {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorData) {
        const { data } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorData.id);
        setMenuItems(data || []);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Button>Add Item</Button>
      </div>
      <div className="grid gap-4">
        {menuItems.map((item: any) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg bg-white shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
                <p className="mt-2">${item.price}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}