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
import { Badge } from '@/components/ui/badge';
import { ImagePlus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MenuItem {
  id: string;
  name: string;
  name_ko?: string;
  description?: string;
  description_ko?: string;
  price: number;
  category: string;
  is_available: boolean;
  image?: string;
}

export function MenuManagement() {
  const session = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ko: '',
    description: '',
    description_ko: '',
    price: '',
    category: '',
    is_available: true,
  });

  // Fetch menu items using React Query with proper error handling
  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: ['vendor-menu-items'],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No session user ID available');
        return [];
      }

      try {
        // First get the vendor ID for the current user
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (vendorError) {
          console.error('Error fetching vendor:', vendorError);
          throw vendorError;
        }

        if (!vendorData) {
          console.error('No vendor found for user:', session.user.id);
          throw new Error('Vendor not found');
        }

        console.log('Found vendor:', vendorData);

        // Then get all menu items for this vendor
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('category', { ascending: true });

        if (error) {
          console.error('Error fetching menu items:', error);
          throw error;
        }
        
        console.log('Fetched vendor menu items:', data);
        return data || [];
      } catch (error: any) {
        console.error('Error in menu items query:', error);
        toast({
          title: 'Error',
          description: 'Failed to load menu items. Please try again.',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: !!session?.user?.id,
  });

  // Show error state if query failed
  useEffect(() => {
    if (error) {
      console.error('Query error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items. Please refresh the page.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  async function handleImageUpload(file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu_items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu_items')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user?.id)
        .single();

      if (vendorError || !vendorData) {
        console.error('Error fetching vendor:', vendorError);
        throw new Error('Vendor not found');
      }

      let imageUrl = editingItem?.image;
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const menuItemData = {
        vendor_id: vendorData.id,
        name: formData.name,
        name_ko: formData.name_ko || null,
        description: formData.description || null,
        description_ko: formData.description_ko || null,
        price: parseFloat(formData.price),
        category: formData.category,
        is_available: formData.is_available,
        image: imageUrl,
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

      if (error) {
        console.error('Error saving menu item:', error);
        throw error;
      }

      toast({
        title: 'Success',
        description: `Menu item ${editingItem ? 'updated' : 'added'} successfully`,
      });

      // Invalidate and refetch menu items
      await queryClient.invalidateQueries({ queryKey: ['vendor-menu-items'] });

      setIsDialogOpen(false);
      setEditingItem(null);
      setSelectedImage(null);
      resetForm();
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

      // Invalidate and refetch menu items
      await queryClient.invalidateQueries({ queryKey: ['vendor-menu-items'] });
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

  if (isLoading) {
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
              setSelectedImage(null);
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
                <Label htmlFor="image">Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Label
                    htmlFor="image"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                  >
                    {selectedImage || editingItem?.image ? (
                      <img
                        src={selectedImage ? URL.createObjectURL(selectedImage) : editingItem?.image}
                        alt="Preview"
                        className="h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImagePlus className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Upload Image</span>
                      </div>
                    )}
                  </Label>
                </div>
              </div>
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
              <div className="flex gap-4">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
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