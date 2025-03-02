
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, MapPin, Truck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Category } from "./types/category";
import { Badge } from "@/components/ui/badge";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
        >
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-sm text-gray-600">{category.name_ko}</p>
            <div className="flex gap-2 mt-1">
              {category.fulfillment_types?.includes('delivery') && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Truck className="h-3 w-3" /> Delivery
                </Badge>
              )}
              {category.fulfillment_types?.includes('pickup') && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" /> Pickup
                </Badge>
              )}
            </div>
            {category.blocked_dates && category.blocked_dates.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Blocked pickup dates: {category.blocked_dates.length}
              </p>
            )}
            {category.fulfillment_types?.includes('pickup') && category.has_custom_pickup && category.pickup_details && category.pickup_details.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Pickup locations: {category.pickup_details.length}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this category? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(category.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No categories yet. Create your first category to organize your menu items.</p>
        </div>
      )}
    </div>
  );
}
