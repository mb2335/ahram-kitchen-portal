import { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface MenuItem {
  id: string;
  name: string;
  name_ko?: string;
  description?: string;
  description_ko?: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
}

export function MenuManagement() {
  const session = useSession();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ko: '',
    description: '',
    description_ko: '',
    price: '',
    category: '',
    is_available: true,
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  async function loadMenuItems() {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorData) {
        const { data } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('category', { ascending: true });
        setMenuItems(data || []);
      }
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
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (!vendorData) throw new Error('Vendor not found');

      const menuItemData = {
        vendor_id: vendorData.id,
        name: formData.name,
        name_ko: formData.name_ko || null,
        description: formData.description || null,
        description_ko: formData.description_ko || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_available: formData.is_available,
      };

      let error;
      if (editingItem) {
        ({ error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editingItem.id));
      } else {
        ({ error } = await supabase
          .from('menu_items')
          .insert([menuItemData]));
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Menu item ${editingItem ? 'updated' : 'added'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingItem(null);
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
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingItem(null);
              resetForm();
            }}>
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_ko">Name (Korean)</Label>
                <Input
                  id="name_ko"
                  value={formData.name_ko}
                  onChange={(e) => setFormData({ ...formData, name_ko: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (English)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_ko">Description (Korean)</Label>
                <Textarea
                  id="description_ko"
                  value={formData.description_ko}
                  onChange={(e) => setFormData({ ...formData, description_ko: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Available</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                {item.name_ko && <p className="text-sm text-gray-600">{item.name_ko}</p>}
                {item.description && <p className="text-sm mt-1">{item.description}</p>}
                {item.description_ko && <p className="text-sm text-gray-600">{item.description_ko}</p>}
                <p className="mt-2">${item.price}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant={item.is_available ? 'default' : 'secondary'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}