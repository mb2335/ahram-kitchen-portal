
import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '../types';
import { useToast } from '@/hooks/use-toast';
import { loadVendorMenuItems, deleteMenuItem } from '../menuItemOperations';
import { useQueryClient } from '@tanstack/react-query';

export function useMenuItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMenuItems = useCallback(async () => {
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
  }, [toast]);

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      // Optimistic UI update - remove the item from local state immediately
      const updatedItems = menuItems.filter(item => item.id !== itemId);
      setMenuItems(updatedItems);
      
      // Update the query cache for immediate UI update
      queryClient.setQueryData(['menu-items'], updatedItems);
      
      // Perform the actual deletion
      await deleteMenuItem(itemId);
      
      // Refresh data to ensure consistency
      await loadMenuItems();
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    } catch (error) {
      // Error handling - revert the optimistic update
      console.error('Error in handleDeleteMenuItem:', error);
      loadMenuItems();
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  return {
    menuItems,
    loading,
    loadMenuItems,
    handleDeleteMenuItem,
  };
}
