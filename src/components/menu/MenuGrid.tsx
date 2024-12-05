import { MenuItem } from "./MenuItem";
import { MenuItem as MenuItemType } from "@/contexts/CartContext";

interface MenuGridProps {
  items: MenuItemType[];
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuGrid({ items, onAddToCart }: MenuGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {items.map((item) => (
        <MenuItem key={item.id} item={item} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}