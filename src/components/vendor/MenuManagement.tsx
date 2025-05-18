
import { useState, useEffect } from 'react';
import { updateMenuItemOrder, loadCategoryMenuItems } from './menu/menuItemOperations';
import { LoadingState } from '../shared/LoadingState';
import { MenuManagementHeader } from './menu/MenuManagementHeader';
import { MenuItemGrid } from './menu/MenuItemGrid';
import { CategoryManagement } from './menu/CategoryManagement';
import { MenuItemDialog } from './menu/components/MenuItemDialog';
import { ItemsHeader } from './menu/components/ItemsHeader';
import { useMenuItems } from './menu/hooks/useMenuItems';
import { useMenuItemForm } from './menu/hooks/useMenuItemForm';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FulfillmentSettings } from './menu/fulfillment/FulfillmentSettings';
import { ReorderModal, ReorderItemType } from './menu/components/ReorderModal';
import { useToast } from '@/hooks/use-toast';

export function MenuManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("categories");
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [itemsToReorder, setItemsToReorder] = useState<ReorderItemType[]>([]);
  
  const { menuItems, loading, loadMenuItems, handleDeleteMenuItem } = useMenuItems();
  
  const {
    selectedImage,
    setSelectedImage,
    editingItem,
    setEditingItem,
    formData,
    setFormData,
    resetForm,
    handleSubmit,
  } = useMenuItemForm(() => {
    setIsDialogOpen(false);
    loadMenuItems();
  });

  useEffect(() => {
    // Set up real-time subscriptions to menu updates
    const menuChannel = supabase
      .channel('menu-management-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_items' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-items'] });
          loadMenuItems();
        }
      )
      .subscribe();

    const categoryChannel = supabase
      .channel('category-management-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'menu_categories' 
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
          loadMenuItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, [queryClient, loadMenuItems]);

  const handleReorderItems = async (categoryId: string | null) => {
    try {
      const items = await loadCategoryMenuItems(categoryId);
      if (items && items.length > 1) {
        // Prepare items for reordering
        const reorderItems = items.map(item => ({
          id: item.id,
          name: item.name,
          order_index: item.order_index
        }));
        
        setItemsToReorder(reorderItems);
        setCurrentCategory(categoryId);
        setIsReorderModalOpen(true);
      } else {
        toast({
          title: "Information",
          description: "Not enough items to reorder",
        });
      }
    } catch (error) {
      console.error('Error loading items for reordering:', error);
      toast({
        title: "Error",
        description: "Failed to load items for reordering",
        variant: "destructive",
      });
    }
  };

  const handleSaveItemOrder = async (reorderedItems: ReorderItemType[]) => {
    setIsSaving(true);
    try {
      await updateMenuItemOrder(reorderedItems);
      await loadMenuItems();
      
      toast({
        title: "Success",
        description: "Item order updated successfully",
      });
    } catch (error) {
      console.error('Error saving item order:', error);
      toast({
        title: "Error",
        description: "Failed to update item order",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] overflow-y-auto pr-4">
      <MenuManagementHeader />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoryManagement removeTabs={true} />
        </TabsContent>
        
        <TabsContent value="items">
          <ItemsHeader 
            onAddClick={() => {
              setEditingItem(null);
              resetForm();
              setSelectedImage(null);
              setIsDialogOpen(true);
            }}
          />
          <MenuItemGrid
            items={menuItems}
            onEdit={(item) => {
              setEditingItem(item);
              setFormData({
                name: item.name,
                name_ko: item.name_ko || '',
                description: item.description || '',
                description_ko: item.description_ko || '',
                price: item.price.toString(),
                quantity_limit: item.quantity_limit ? item.quantity_limit.toString() : '',
                is_available: item.is_available,
                category_id: item.category_id || undefined,
                discount_percentage: item.discount_percentage ? item.discount_percentage.toString() : '',
              });
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteMenuItem}
            onReorder={handleReorderItems}
          />
        </TabsContent>

        <TabsContent value="fulfillment">
          <FulfillmentSettings />
        </TabsContent>
      </Tabs>

      <MenuItemDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        onSubmit={handleSubmit}
      />

      <ReorderModal
        isOpen={isReorderModalOpen}
        onOpenChange={setIsReorderModalOpen}
        items={itemsToReorder}
        title={`Reorder ${currentCategory ? 'Category' : 'Uncategorized'} Items`}
        onSave={handleSaveItemOrder}
        isSaving={isSaving}
      />
    </div>
  );
}
