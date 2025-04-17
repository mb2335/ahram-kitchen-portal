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
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      const { data: maxOrderData } = await supabase
        .from('menu_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
        ? (maxOrderData[0].order_index + 1) 
        : 1;

      // If editing, preserve existing pickup and delivery settings
      const categoryData: any = {
        name: formData.name,
        name_ko: formData.name_ko,
        vendor_id: vendorData.id,
        order_index: editingCategory ? editingCategory.order_index : nextOrderIndex,
        fulfillment_types: formData.fulfillment_types,
      };

      // When editing, preserve existing properties not in form
      if (editingCategory) {
        // Keep existing settings if editing
        if (editingCategory.has_custom_pickup !== undefined) {
          categoryData.has_custom_pickup = editingCategory.has_custom_pickup;
        }
        if (editingCategory.pickup_details) {
          categoryData.pickup_details = editingCategory.pickup_details;
        }
        if (editingCategory.pickup_days) {
          categoryData.pickup_days = editingCategory.pickup_days;
        }
      } else {
        // Set defaults for new categories
        categoryData.has_custom_pickup = false;
        categoryData.pickup_details = [];
        categoryData.pickup_days = [];
      }

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
