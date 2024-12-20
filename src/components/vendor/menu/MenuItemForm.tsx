import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImagePlus } from 'lucide-react';
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
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-4">
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
          min="1"
          value={formData.quantity_limit}
          onChange={(e) => setFormData({ ...formData, quantity_limit: e.target.value })}
          required
        />
        <p className="text-sm text-gray-500">Maximum number of items that can be ordered</p>
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