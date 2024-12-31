import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CategoryFormData } from '../types/category';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useCategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string, itemCount: number } | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_ko: '',
    deliveryAvailableFrom: undefined,
    deliveryAvailableUntil: undefined,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ko: '',
      deliveryAvailableFrom: undefined,
      deliveryAvailableUntil: undefined,
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.deliveryAvailableUntil && formData.deliveryAvailableFrom && 
        formData.deliveryAvailableUntil < formData.deliveryAvailableFrom) {
      toast({
        title: "Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      // Get the current highest order_index
      const { data: maxOrderData } = await supabase
        .from('menu_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order_index + 1) 
        : 1;

      const categoryData = {
        name: formData.name,
        name_ko: formData.name_ko,
        vendor_id: vendorData.id,
        delivery_available_from: formData.deliveryAvailableFrom?.toISOString(),
        delivery_available_until: formData.deliveryAvailableUntil?.toISOString(),
        order_index: editingCategory ? editingCategory.order_index : nextOrderIndex,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert([categoryData]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingCategory,
    setEditingCategory,
    categoryToDelete,
    setCategoryToDelete,
    formData,
    setFormData,
    resetForm,
    handleSubmit,
  };
}