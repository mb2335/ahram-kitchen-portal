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

      const { error } = await supabase
        .from('menu_categories')
        .insert({
          name: formData.name,
          name_ko: formData.name_ko,
          vendor_id: vendorData.id,
          order_index: (categories?.length || 0) + 1,
          delivery_available_from: formData.deliveryAvailableFrom?.toISOString(),
          delivery_available_until: formData.deliveryAvailableUntil?.toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        name_ko: '',
        deliveryAvailableFrom: undefined,
        deliveryAvailableUntil: undefined,
      });
      refetch();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categories</h3>
        <Button onClick={() => setIsDialogOpen(true)}>
          Add Category
        </Button>
      </div>

      <CategoryList categories={categories} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
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