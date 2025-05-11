
import { useState } from 'react';
import { MenuItem, MenuFormData } from '../types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { handleImageUpload, saveMenuItem } from '../menuItemOperations';

export function useMenuItemForm(onSuccess: () => void) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    name_ko: '',
    description: '',
    description_ko: '',
    price: '',
    quantity_limit: '',
    is_available: true,
    discount_percentage: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ko: '',
      description: '',
      description_ko: '',
      price: '',
      quantity_limit: '',
      is_available: true,
      category_id: undefined,
      discount_percentage: '',
    });
    setEditingItem(null);
    setSelectedImage(null);
  };

  const handleSubmit = async (data: MenuFormData & { image?: File }) => {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to perform this action',
          variant: 'destructive',
        });
        throw new Error('Authentication required');
      }
      
      let imageUrl = editingItem?.image;
      
      if (data.image) {
        imageUrl = await handleImageUpload(data.image);
      }

      // Handle image removal
      if (editingItem?.image && !imageUrl && !selectedImage) {
        const fileName = editingItem.image.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('menu_items')
            .remove([fileName]);
        }
        imageUrl = null;
      }

      const menuItemData = {
        name: data.name,
        name_ko: data.name_ko,
        description: data.description || null,
        description_ko: data.description_ko || null,
        price: parseFloat(data.price),
        quantity_limit: data.quantity_limit ? parseInt(data.quantity_limit) : null,
        is_available: data.is_available,
        image: imageUrl,
        category_id: data.category_id || null,
        order_index: editingItem?.order_index || 0,
        discount_percentage: data.discount_percentage ? parseInt(data.discount_percentage) : null,
      };

      await saveMenuItem(menuItemData, editingItem?.id);
      console.log("Menu item saved successfully:", editingItem?.id || 'new item');

      toast({
        title: 'Success',
        description: `Menu item ${editingItem ? 'updated' : 'added'} successfully`,
      });

      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item',
        variant: 'destructive',
      });
    }
  };

  return {
    selectedImage,
    setSelectedImage,
    editingItem,
    setEditingItem,
    formData,
    setFormData,
    resetForm,
    handleSubmit,
  };
}
