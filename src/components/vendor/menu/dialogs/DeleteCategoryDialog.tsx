import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: 'delete' | 'uncategorize') => Promise<void>;
  itemCount: number;
}

export function DeleteCategoryDialog({ isOpen, onClose, onConfirm, itemCount }: DeleteCategoryDialogProps) {
  const [selectedAction, setSelectedAction] = useState<'delete' | 'uncategorize'>('uncategorize');

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            This category contains {itemCount} menu item{itemCount !== 1 ? 's' : ''}. 
            What would you like to do with these items?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedAction} onValueChange={(value: 'delete' | 'uncategorize') => setSelectedAction(value)}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="uncategorize" id="uncategorize" />
              <Label htmlFor="uncategorize">
                Move items to uncategorized (items will be marked as unavailable)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delete" id="delete" />
              <Label htmlFor="delete">Delete all items in this category</Label>
            </div>
          </RadioGroup>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedAction)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}