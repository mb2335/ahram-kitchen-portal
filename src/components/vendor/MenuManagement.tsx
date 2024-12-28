import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MenuItemForm } from './menu/MenuItemForm';
import { MenuItemGrid } from './menu/MenuItemGrid';
import { CategoryManagement } from './menu/CategoryManagement';
import { MenuItem, MenuFormData } from './menu/types';
import { loadVendorMenuItems, saveMenuItem, deleteMenuItem, updateMenuItemOrder, handleImageUpload } from './menu/menuItemOperations';
import { LoadingState } from '../shared/LoadingState';
import { MenuManagementHeader } from './menu/MenuManagementHeader';

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
    quantity_limit: '',
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

  async function handleSubmit(data: MenuFormData & { image?: File }) {
    try {
      let imageUrl = editingItem?.image;
      if (data.image) {
        imageUrl = await handleImageUpload(data.image);
      }

      const menuItemData = {
        name: data.name,
        name_ko: data.name_ko,
        description: data.description || null,
        description_ko: data.description_ko || null,
        price: parseFloat(data.price),
        quantity_limit: data.quantity_limit ? parseInt(data.quantity_limit) : null,
        is_available: data.is_available,
        image: imageUrl,
        category_id: data.category_id || null,
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

  function resetForm() {
    setFormData({
      name: '',
      name_ko: '',
      description: '',
      description_ko: '',
      price: '',
      quantity_limit: '',
      is_available: true,
      category_id: undefined,
    });
  }

  async function handleDeleteMenuItem(itemId: string) {
    try {
      await deleteMenuItem(itemId);
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      loadMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] overflow-y-auto">
      <MenuManagementHeader
        onAddClick={() => {
          setEditingItem(null);
          resetForm();
          setSelectedImage(null);
        }}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
      
      <CategoryManagement />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to {editingItem ? 'update' : 'add'} a menu item.
            </DialogDescription>
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
          });
          setIsDialogOpen(true);
        }}
        onDelete={handleDeleteMenuItem}
        onReorder={updateMenuItemOrder}
      />
    </div>
  );
}
