
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
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
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
