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
import { MenuItem } from "./types";
import { Dispatch, SetStateAction } from "react";
import { Loader2, X } from "lucide-react";
import { ImageUpload } from "./components/ImageUpload";
import { BasicDetails } from "./components/BasicDetails";
import { PricingDetails } from "./components/PricingDetails";
import { CategorySelection } from "./components/CategorySelection";

interface MenuItemFormProps {
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

  const watchCategoryId = watch('category_id');
  const watchIsAvailable = watch('is_available');

  // Only disable availability when trying to enable without a category
  if (watchIsAvailable && !watchCategoryId) {
    setValue('is_available', false);
  }

  const handleFormSubmit = async (data: MenuFormData) => {
    const availabilityError = validateMenuItemAvailability(data.category_id, data.is_available);
    if (availabilityError && data.is_available) {
      return;
    }
    await onSubmit({ ...data, image: selectedImage || undefined });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
      <div className="space-y-4">
        <ImageUpload
          editingItem={editingItem}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
        <BasicDetails register={register} errors={errors} />
        <PricingDetails register={register} errors={errors} />
        <CategorySelection
          watchCategoryId={watchCategoryId}
          setValue={setValue}
          watchIsAvailable={watchIsAvailable}
        />
      </div>

      <Button type="submit" className="w-full">
        {editingItem ? 'Update' : 'Add'} Menu Item
      </Button>
    </form>
  );
}