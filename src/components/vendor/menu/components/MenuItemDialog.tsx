import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MenuItemForm } from '../MenuItemForm';
import { MenuItem, MenuFormData } from '../types';

interface MenuItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  formData: MenuFormData;
  setFormData: (data: MenuFormData) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  onSubmit: (data: MenuFormData & { image?: File }) => void;
}

export function MenuItemDialog({
  isOpen,
  onOpenChange,
  editingItem,
  formData,
  setFormData,
  selectedImage,
  setSelectedImage,
  onSubmit,
}: MenuItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}