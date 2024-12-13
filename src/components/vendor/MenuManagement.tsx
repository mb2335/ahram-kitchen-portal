import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MenuItemForm } from './menu/MenuItemForm';
import { MenuItemGrid } from './menu/MenuItemGrid';
import { MenuItem, MenuFormData } from './menu/types';
import { loadVendorMenuItems, saveMenuItem, deleteMenuItem, updateMenuItemOrder } from './menu/menuItemOperations';

export function MenuManagement() {
  const session = useSession();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    name_ko: '',
    description: '',
    description_ko: '',
    price: '',
    category: '',
    is_available: true,
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadMenuItems();
    }
  }, [session?.user?.id]);

  async function loadMenuItems() {
    try {
      const data = await loadVendorMenuItems(session?.user?.id!);
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      let imageUrl = editingItem?.image;
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const menuItemData = {
        name: formData.name,
        name_ko: formData.name_ko,
        description: formData.description || null,
        description_ko: formData.description_ko || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_available: formData.is_available,
        image: imageUrl,
        order_index: editingItem ? editingItem.order_index : menuItems.length + 1,
      };

      await saveMenuItem(session?.user?.id!, menuItemData, editingItem?.id);

      toast({
        title: 'Success',
        description: `Menu item ${editingItem ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingItem(null);
      setSelectedImage(null);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu item',
        variant: 'destructive',
      });
    }
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

  async function handleReorder(reorderedItems: MenuItem[]) {
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        order_index: index + 1,
      }));

      await updateMenuItemOrder(updates);
      setMenuItems(reorderedItems);
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

  function handleEdit(item: MenuItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      name_ko: item.name_ko || '',
      description: item.description || '',
      description_ko: item.description_ko || '',
      price: item.price.toString(),
      category: item.category,
      is_available: item.is_available,
    });
    setIsDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      name_ko: '',
      description: '',
      description_ko: '',
      price: '',
      category: '',
      is_available: true,
    });
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
            <Button onClick={() => {
              setEditingItem(null);
              resetForm();
              setSelectedImage(null);
            }}>
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
              onSubmit={handleSubmit}
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