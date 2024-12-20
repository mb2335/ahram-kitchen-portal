import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MenuItemForm } from './menu/MenuItemForm';
import { MenuItemGrid } from './menu/MenuItemGrid';
import { useMenuItems } from './menu/useMenuItems';
import { useMenuForm } from './menu/useMenuForm';
import { deleteMenuItem, updateMenuItemOrder } from './menu/menuItemOperations';
import { useToast } from '@/components/ui/use-toast';

export function MenuManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { menuItems, setMenuItems, loading, loadMenuItems } = useMenuItems();
  const {
    editingItem,
    selectedImage,
    setSelectedImage,
    formData,
    setFormData,
    handleSubmit,
    handleEdit,
    resetForm,
  } = useMenuForm(onFormSuccess);

  function onFormSuccess() {
    setIsDialogOpen(false);
    loadMenuItems();
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteMenuItem(itemId);
      toast({
        title: 'Success',
        description: 'Menu item deleted successfully',
      });
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  }

  async function handleReorder(reorderedItems: typeof menuItems) {
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order_index: index + 1,
      }));

      await updateMenuItemOrder(updates);
      setMenuItems(reorderedItems);
      
      toast({
        title: 'Success',
        description: 'Menu order updated successfully',
      });
    } catch (error) {
      console.error('Error updating menu item order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update menu item order',
        variant: 'destructive',
      });
      loadMenuItems();
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 py-4 px-2">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <MenuItemForm
              editingItem={editingItem}
              formData={formData}
              setFormData={setFormData}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              onSubmit={(e) => handleSubmit(e, menuItems)}
            />
          </DialogContent>
        </Dialog>
      </div>
      <MenuItemGrid
        items={menuItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReorder={handleReorder}
      />
    </div>
  );
}