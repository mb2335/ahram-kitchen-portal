
import { useState, useEffect } from 'react';
import { updateMenuItemOrder } from './menu/menuItemOperations';
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
import { toast } from "@/hooks/use-toast";
import { MenuItem } from './menu/types';

export function MenuManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("items");
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

  const handleReorderMenuItems = async (items: MenuItem[]) => {
    try {
      // Optimistic UI update - update local state immediately
      queryClient.setQueryData(['menu-items'], items);
      
      // Send update to the server
      await updateMenuItemOrder(items);
      
      // No need to explicitly refresh data as the realtime subscription will handle updates
      
      // Optional success toast
      toast({
        title: "Success",
        description: "Menu item order updated",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error reordering menu items:', error);
      toast({
        title: "Error",
        description: "Failed to update menu item order",
        variant: "destructive",
      });
      
      // Revert optimistic update on error by refreshing from the server
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      loadMenuItems();
    }
  };

  // We no longer need to set up real-time subscriptions here as they are handled by useMenuChannel

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
            onReorder={handleReorderMenuItems}
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
    </div>
  );
}
