import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuFormData } from "./types";
import { validateMenuItemAvailability } from "./utils/menuItemValidation";
import { toast } from "@/hooks/use-toast";
import { MenuItem } from "./types";
import { Dispatch, SetStateAction, useCallback } from "react";
import { Loader2, X } from "lucide-react";

export interface MenuItemFormProps {
  onSubmit: (data: MenuFormData & { image?: File }) => Promise<void>;
  editingItem: MenuItem | null;
  formData: MenuFormData;
  setFormData: Dispatch<SetStateAction<MenuFormData>>;
  selectedImage: File | null;
  setSelectedImage: Dispatch<SetStateAction<File | null>>;
}

export function MenuItemForm({ 
  onSubmit, 
  editingItem, 
  formData, 
  setFormData, 
  selectedImage, 
  setSelectedImage 
}: MenuItemFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MenuFormData>({
    defaultValues: formData
  });

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

  const watchCategoryId = watch('category_id');
  const watchIsAvailable = watch('is_available');

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
    }
  }, [setSelectedImage]);

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) input.value = '';
  }, [setSelectedImage]);

  // Validate availability when category changes
  const availabilityError = validateMenuItemAvailability(watchCategoryId, watchIsAvailable);
  if (availabilityError && watchIsAvailable) {
    setValue('is_available', false);
    toast({
      title: "Availability Update",
      description: availabilityError,
      variant: "destructive",
    });
  }

  const handleFormSubmit = async (data: MenuFormData) => {
    const availabilityError = validateMenuItemAvailability(data.category_id, data.is_available);
    if (availabilityError) {
      toast({
        title: "Validation Error",
        description: availabilityError,
        variant: "destructive",
      });
      return;
    }
    await onSubmit({ ...data, image: selectedImage || undefined });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Image</Label>
          <div className="space-y-2">
            {(selectedImage || editingItem?.image) && (
              <div className="relative w-full h-48">
                <img
                  src={selectedImage ? URL.createObjectURL(selectedImage) : editingItem?.image}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name (English)</Label>
          <Input id="name" {...register('name', { required: true })} />
          {errors.name && <p className="text-sm text-red-500">Name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_ko">Name (Korean)</Label>
          <Input id="name_ko" {...register('name_ko', { required: true })} />
          {errors.name_ko && <p className="text-sm text-red-500">Korean name is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (English)</Label>
          <Textarea id="description" {...register('description')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description_ko">Description (Korean)</Label>
          <Textarea id="description_ko" {...register('description_ko')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input 
            id="price" 
            type="number" 
            step="0.01" 
            {...register('price', { required: true })} 
          />
          {errors.price && <p className="text-sm text-red-500">Price is required</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_limit">Quantity Limit (optional)</Label>
          <Input 
            id="quantity_limit" 
            type="number" 
            {...register('quantity_limit')} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            onValueChange={(value) => setValue('category_id', value)}
            value={watchCategoryId}
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

        <div className="flex items-center space-x-2">
          <Switch 
            id="is_available" 
            checked={watchIsAvailable}
            onCheckedChange={(checked) => setValue('is_available', checked)}
            disabled={!watchCategoryId}
          />
          <Label htmlFor="is_available">
            Available
            {!watchCategoryId && (
              <span className="ml-2 text-sm text-muted-foreground">
                (Requires category)
              </span>
            )}
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {editingItem ? 'Update' : 'Add'} Menu Item
      </Button>
    </form>
  );
}