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
import { Category, DeliverySettings, PickupDetail } from './types/category';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CategoryManagement() {
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
      
      // Get the related delivery schedules for all categories
      const { data: deliverySchedules } = await supabase
        .from('delivery_schedules')
        .select('*');
      
      // Group delivery schedules by category
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
        // Extract delivery settings from schedules
        let delivery_settings: DeliverySettings = {
          activated_slots: [],
        };
        
        const categorySchedules = schedulesByCategory[category.id] || [];
        if (categorySchedules.length > 0) {
          // Combine activated slots from all schedules
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
        
        return {
          ...category,
          pickup_details: (category.pickup_details || []).map((detail: any) => ({
            day: detail.day !== undefined ? detail.day : 0,
            time: detail.time || '',
            location: detail.location || ''
          })) as PickupDetail[],
          fulfillment_types: category.fulfillment_types || [],
          pickup_days: category.pickup_days || [],
          delivery_settings
        } as Category;
      });
    },
  });

  // Subscribe to real-time changes
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
          // Invalidate the cache and immediately refetch
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
          // Invalidate the cache and immediately refetch categories to get updated delivery settings
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
        // Immediately refetch after deletion
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
      
      // Immediately refetch after deletion
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
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
                has_custom_pickup: category.has_custom_pickup || false,
                pickup_details: category.pickup_details || [],
                fulfillment_types: category.fulfillment_types || [],
                pickup_days: category.pickup_days || [],
                delivery_settings: category.delivery_settings || {
                  activated_slots: [],
                }
              });
              setIsDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

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
