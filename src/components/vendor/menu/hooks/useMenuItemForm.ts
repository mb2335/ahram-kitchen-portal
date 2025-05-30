
import { useState } from 'react';
import { MenuItem, MenuFormData } from '../types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { handleImageUpload, saveMenuItem } from '../menuItemOperations';
import { useQueryClient } from "@tanstack/react-query";

export function useMenuItemForm(onSuccess: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const handleSubmit = async (data: MenuFormData & { image?: File; imageRemoved?: boolean }) => {
    try {
      let imageUrl = editingItem?.image;
      
      // Handle new image upload
      if (data.image) {
        imageUrl = await handleImageUpload(data.image);
      }
      // Handle image removal
      else if (data.imageRemoved && editingItem?.image) {
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

      // Invalidate queries to ensure all components using menu items get updated
      await queryClient.invalidateQueries({ queryKey: ['menu-items'] });

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
