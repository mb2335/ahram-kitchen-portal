
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
import { Category } from './types/category';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FulfillmentSettings } from './fulfillment/FulfillmentSettings';

interface CategoryManagementProps {
  removeTabs?: boolean;
}

export function CategoryManagement({ removeTabs = false }: CategoryManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("categories");
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
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) {
        throw error;
      }
      
      return data.map(category => ({
        ...category,
        fulfillment_types: category.fulfillment_types || []
      })) as Category[];
    },
  });

  useEffect(() => {
    const categoryChannel = supabase
      .channel('category-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        async () => {
          await queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(categoryChannel);
    };
  }, [queryClient, refetch]);

  const handleDelete = async (categoryId: string) => {
    try {
      const itemCount = await checkCategoryItems(categoryId);
      if (itemCount > 0) {
        setCategoryToDelete({ id: categoryId, itemCount });
      } else {
        await deleteCategory(categoryId);
        await refetch();
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
      }
    } catch (error) {
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
      
      await refetch();
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      setCategoryToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-6">
      {!removeTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
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
                  fulfillment_types: category.fulfillment_types || []
                });
                setIsDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          </TabsContent>
          
          <TabsContent value="items">
            <div className="p-4">
              <h2 className="text-lg font-medium mb-4">Item Management</h2>
              <p className="text-muted-foreground">
                Items management has been moved to this tab for better organization.
                Please use the Menu Management section to add or edit items.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="fulfillment">
            <FulfillmentSettings categories={categories} />
          </TabsContent>
        </Tabs>
      ) : (
        <>
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
                fulfillment_types: category.fulfillment_types || []
              });
              setIsDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        </>
      )}

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
