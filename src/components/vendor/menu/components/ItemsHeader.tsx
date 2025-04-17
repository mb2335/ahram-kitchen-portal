
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ItemsHeaderProps {
  onAddClick: () => void;
}

export function ItemsHeader({ onAddClick }: ItemsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Items</h3>
      <Button onClick={onAddClick}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
