
import { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { useToast } from '@/hooks/use-toast';
import { loadVendorMenuItems, deleteMenuItem } from '../menuItemOperations';

export function useMenuItems() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenuItems = async () => {
    try {
      const data = await loadVendorMenuItems();
      setMenuItems(data || []);
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
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await deleteMenuItem(itemId);
      // The toast notification is handled inside the deleteMenuItem function
      loadMenuItems();
    } catch (error) {
      // Error handling is done in deleteMenuItem
      console.error('Error in handleDeleteMenuItem:', error);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  return {
    menuItems,
    loading,
    loadMenuItems,
    handleDeleteMenuItem,
  };
}
