
import { MenuItem } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageUploadProps {
  editingItem: MenuItem | null;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  imageRemoved?: boolean;
  setImageRemoved?: (removed: boolean) => void;
}

export function ImageUpload({ 
  editingItem, 
  selectedImage, 
  setSelectedImage,
  imageRemoved = false,
  setImageRemoved 
}: ImageUploadProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Reset image removed flag when a new image is selected
      if (setImageRemoved) {
        setImageRemoved(false);
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    // Mark existing image as removed
    if (setImageRemoved) {
      setImageRemoved(true);
    }
    // Clear the file input
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Determine if we should show an image
  const hasImage = selectedImage || (editingItem?.image && !imageRemoved);
  const imageUrl = selectedImage ? URL.createObjectURL(selectedImage) : editingItem?.image;

  return (
    <div className="space-y-2">
      <Label htmlFor="image">Image</Label>
      <div className="space-y-2">
        {hasImage && imageUrl && (
          <div className="relative w-full max-w-md">
            <AspectRatio ratio={4/3} className="bg-muted rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
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
            </AspectRatio>
          </div>
        )}
        <div className="my-4">
          <p className="text-sm text-muted-foreground mb-2">
            Image should have a 4:3 aspect ratio for best display. Recommended minimum size is 800x600 pixels.
          </p>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
