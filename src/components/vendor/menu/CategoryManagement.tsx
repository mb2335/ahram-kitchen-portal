
import { CategoryForm } from './CategoryForm';
import { CategoryList } from './CategoryList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteCategoryDialog } from './dialogs/DeleteCategoryDialog';
import { CategoryHeader } from './components/CategoryHeader';
import { useCategoryManagement } from './hooks/useCategoryManagement';
import { checkCategoryItems, deleteCategory, removeItemsCategory, deleteMenuItems } from './utils/categoryOperations';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category, PickupDetail } from './types/category';
import { useEffect } from 'react';

export function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
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
  } = useCategoryManagement();

  const { data: categories = [], refetch } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      return data.map(category => ({
        ...category,
        pickup_details: (category.pickup_details || []).map((detail: any) => ({
          time: detail.time || '',
          location: detail.location || ''
        })) as PickupDetail[],
        fulfillment_types: category.fulfillment_types || [],
        pickup_days: category.pickup_days || [],
      })) as Category[];
    },
  });

  // Subscribe to real-time changes
  useEffect(() => {
    console.log('Setting up category subscription...');
    const channel = supabase
      .channel('category-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        async (payload) => {
          console.log('Category change detected:', payload);
          // Invalidate the cache and immediately refetch
          await queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
          refetch();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up category subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, refetch]);

  const handleDelete = async (categoryId: string) => {
    try {
      const itemCount = await checkCategoryItems(categoryId);
      if (itemCount > 0) {
        setCategoryToDelete({ id: categoryId, itemCount });
      } else {
        await deleteCategory(categoryId);
        // Immediately refetch after deletion
        await refetch();
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error in delete process:', error);
      toast({
        title: "Error",
        description: "Failed to process deletion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async (action: 'delete' | 'uncategorize') => {
    if (!categoryToDelete) return;

    try {
      if (action === 'delete') {
        await deleteMenuItems(categoryToDelete.id);
      } else {
        await removeItemsCategory(categoryToDelete.id);
      }
      
      await deleteCategory(categoryToDelete.id);
      
      // Immediately refetch after deletion
      await refetch();
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error in delete confirmation:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      <CategoryHeader
        onAddClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}
      />
      
      <CategoryList 
        categories={categories || []}
        onEdit={(category) => {
          setEditingCategory(category);
          setFormData({
            name: category.name,
            name_ko: category.name_ko,
            has_custom_pickup: category.has_custom_pickup || false,
            pickup_details: category.pickup_details || [],
            fulfillment_types: category.fulfillment_types || [],
            pickup_days: category.pickup_days || [],
            allow_joint_pickup: category.allow_joint_pickup || false,
          });
          setIsDialogOpen(true);
        }}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
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

      <DeleteCategoryDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
        itemCount={categoryToDelete?.itemCount || 0}
      />
    </div>
  );
}
