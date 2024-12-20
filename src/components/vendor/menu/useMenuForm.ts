import { useState } from 'react';
import { MenuItem, MenuFormData } from './types';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from '@supabase/auth-helpers-react';
import { saveMenuItem, handleImageUpload } from './menuItemOperations';

export function useMenuForm(onSuccess: () => void) {
  const session = useSession();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    name_ko: '',
    description: '',
    description_ko: '',
    price: '',
    is_available: true,
    quantity: '',
  });

  async function handleSubmit(e: React.FormEvent, menuItems: MenuItem[]) {
    e.preventDefault();
    try {
      let imageUrl = editingItem?.image;
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const menuItemData = {
        name: formData.name,
        name_ko: formData.name_ko,
        description: formData.description || null,
        description_ko: formData.description_ko || null,
        price: parseFloat(formData.price),
        is_available: formData.is_available,
        image: imageUrl,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        order_index: editingItem ? editingItem.order_index : menuItems.length + 1,
      };

      await saveMenuItem(session?.user?.id!, menuItemData, editingItem?.id);

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
  }

  function handleEdit(item: MenuItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      name_ko: item.name_ko || '',
      description: item.description || '',
      description_ko: item.description_ko || '',
      price: item.price.toString(),
      is_available: item.is_available,
      quantity: item.quantity?.toString() || '',
    });
  }

  function resetForm() {
    setFormData({
      name: '',
      name_ko: '',
      description: '',
      description_ko: '',
      price: '',
      is_available: true,
      quantity: '',
    });
    setEditingItem(null);
    setSelectedImage(null);
  }

  return {
    editingItem,
    selectedImage,
    setSelectedImage,
    formData,
    setFormData,
    handleSubmit,
    handleEdit,
    resetForm,
  };
}