import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem, MenuFormData } from './types';

interface MenuItemFormProps {
  editingItem: MenuItem | null;
  formData: MenuFormData;
  setFormData: (data: MenuFormData) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MenuItemForm({
  editingItem,
  formData,
  setFormData,
  selectedImage,
  setSelectedImage,
  onSubmit
}: MenuItemFormProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_categories')
        .select('*')
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-4">
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
        />
        {(selectedImage || editingItem?.image) && (
          <img
            src={selectedImage ? URL.createObjectURL(selectedImage) : editingItem?.image}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id || ''}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          required
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
        <Label htmlFor="quantity_limit">Quantity Limit</Label>
        <Input
          id="quantity_limit"
          type="number"
          value={formData.quantity_limit}
          onChange={(e) => setFormData({ ...formData, quantity_limit: e.target.value })}
          placeholder="Leave blank for unlimited"
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
  );
}