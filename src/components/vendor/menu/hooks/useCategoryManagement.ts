
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
      // Get the next order index for new categories
      const { data: maxOrderData, error: orderError } = await supabase
        .from('menu_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      if (orderError) {
        console.error('Error getting max order index:', orderError);
        throw orderError;
      }

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order_index + 1) 
        : 1;

      // Prepare category data
      const categoryData = {
        name: formData.name,
        name_ko: formData.name_ko,
        order_index: editingCategory ? editingCategory.order_index : nextOrderIndex,
        fulfillment_types: formData.fulfillment_types,
        has_custom_pickup: false // Simplified as per existing code
      };
      
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) {
          console.error('Error updating category:', error);
          throw error;
        }
        console.log("Updated category successfully");
      } else {
        // Insert new category
        const { error } = await supabase
          .from('menu_categories')
          .insert([categoryData]);

        if (error) {
          console.error('Error creating category:', error);
          throw error;
        }
        console.log("Created new category successfully");
      }

      toast({
        title: "Success",
        description: `Category ${editingCategory ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
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
