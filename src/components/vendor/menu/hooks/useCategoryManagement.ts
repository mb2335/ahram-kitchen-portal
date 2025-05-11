
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CategoryFormData } from '../types/category';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";

export function useCategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string, itemCount: number } | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_ko: '',
    fulfillment_types: [],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_ko: '',
      fulfillment_types: [],
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form data:", formData);

    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');

      const { data: maxOrderData } = await supabase
        .from('menu_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order_index + 1) 
        : 1;

      // Simplified category data - we don't need to specify vendor_id
      // RLS policies will associate it with the authenticated user
      const categoryData = {
        name: formData.name,
        name_ko: formData.name_ko,
        order_index: editingCategory ? editingCategory.order_index : nextOrderIndex,
        fulfillment_types: formData.fulfillment_types,
        has_custom_pickup: false // Simplified to always false as we don't use this field anymore
      };
      
      let categoryId: string;
      
      if (editingCategory) {
        const { error, data } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .select('id')
          .single();

        if (error) throw error;
        categoryId = editingCategory.id;
        console.log("Updated category with ID:", categoryId);
      } else {
        const { error, data } = await supabase
          .from('menu_categories')
          .insert([categoryData])
          .select('id')
          .single();

        if (error) throw error;
        categoryId = data.id;
        console.log("Created new category with ID:", categoryId);
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
