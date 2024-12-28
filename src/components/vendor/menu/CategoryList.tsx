import { format } from "date-fns";
import { Category } from "./types/category";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
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
            {category.delivery_available_from && category.delivery_available_until && (
              <p className="text-xs text-gray-500">
                Delivery available: {format(new Date(category.delivery_available_from), "PPP")} - {format(new Date(category.delivery_available_until), "PPP")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}