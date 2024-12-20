import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { MenuItem } from './types';
import { loadVendorMenuItems } from './menuItemOperations';

export function useMenuItems() {
  const session = useSession();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMenuItems() {
    try {
      if (session?.user?.id) {
        const data = await loadVendorMenuItems(session.user.id);
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

  useEffect(() => {
    if (session?.user?.id) {
      loadMenuItems();
    }
  }, [session?.user?.id]);

  return { menuItems, setMenuItems, loading, loadMenuItems };
}