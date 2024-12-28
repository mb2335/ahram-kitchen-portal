import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { CategoryFormData } from './types/category';

export function CategoryManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    name_ko: '',
    deliveryAvailableFrom: undefined,
    deliveryAvailableUntil: undefined,
  });

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        throw vendorError;
      }

      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

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
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .single();

      if (vendorError) throw vendorError;

      const categoryData = {
        name: formData.name,
        name_ko: formData.name_ko,
        vendor_id: vendorData.id,
        order_index: editingCategory ? editingCategory.order_index : (categories?.length || 0) + 1,
        delivery_available_from: formData.deliveryAvailableFrom?.toISOString(),
        delivery_available_until: formData.deliveryAvailableUntil?.toISOString(),
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
      refetch();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ko: category.name_ko,
      deliveryAvailableFrom: category.delivery_available_from ? new Date(category.delivery_available_from) : undefined,
      deliveryAvailableUntil: category.delivery_available_until ? new Date(category.delivery_available_until) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ko: '',
      deliveryAvailableFrom: undefined,
      deliveryAvailableUntil: undefined,
    });
    setEditingCategory(null);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          Add Category
        </Button>
      </div>

      <CategoryList 
        categories={categories} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}