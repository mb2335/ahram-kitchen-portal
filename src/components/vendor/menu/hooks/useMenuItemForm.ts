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
    });
    setEditingItem(null);
    setSelectedImage(null);
  };

  const handleSubmit = async (data: MenuFormData & { image?: File }, userId: string) => {
    try {
      let imageUrl = editingItem?.image;
      
      if (data.image) {
        imageUrl = await handleImageUpload(data.image);
      }

      if (editingItem?.image && !data.image && !selectedImage) {
        const fileName = editingItem.image.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('menu_items')
            .remove([fileName]);
        }
        imageUrl = null;
      }

      // Get the maximum order_index for the current vendor
      const { data: maxOrderIndex } = await supabase
        .from('menu_items')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

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
        order_index: editingItem?.order_index || (maxOrderIndex?.order_index || 0) + 1,
      };

      await saveMenuItem(userId, menuItemData, editingItem?.id);

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