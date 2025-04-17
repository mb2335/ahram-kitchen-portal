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
import { Category, DeliverySettings } from './types/category';
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
      
      const { data: deliverySchedules } = await supabase
        .from('delivery_schedules')
        .select('*');
      
      const schedulesByCategory: Record<string, any[]> = {};
      if (deliverySchedules) {
        deliverySchedules.forEach(schedule => {
          if (!schedulesByCategory[schedule.category_id]) {
            schedulesByCategory[schedule.category_id] = [];
          }
          schedulesByCategory[schedule.category_id].push(schedule);
        });
      }
      
      return data.map(category => {
        let delivery_settings: DeliverySettings = {
          activated_slots: [],
        };
        
        const categorySchedules = schedulesByCategory[category.id] || [];
        if (categorySchedules.length > 0) {
          const allSlots = new Set<string>();
          categorySchedules.forEach(schedule => {
            if (schedule.activated_slots && Array.isArray(schedule.activated_slots)) {
              schedule.activated_slots.forEach((slot: string) => allSlots.add(slot));
            }
          });
          
          delivery_settings = {
            activated_slots: [...allSlots],
          };
        }
        
        console.log(`Category ${category.name} has ${delivery_settings.activated_slots.length} activated slots:`, 
          delivery_settings.activated_slots);
        
        return {
          ...category,
          pickup_details: (category.pickup_details || []).map((detail: any) => ({
            day: detail.day !== undefined ? detail.day : 0,
            time: detail.time || '',
            location: detail.location || ''
          })),
          fulfillment_types: category.fulfillment_types || [],
          pickup_days: category.pickup_days || [],
          delivery_settings
        } as Category;
      });
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
      
    const scheduleChannel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'delivery_schedules' 
        },
        async () => {
          await queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(categoryChannel);
      supabase.removeChannel(scheduleChannel);
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
                console.log("Editing category with delivery settings:", category.delivery_settings);
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
              console.log("Editing category with delivery settings:", category.delivery_settings);
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
