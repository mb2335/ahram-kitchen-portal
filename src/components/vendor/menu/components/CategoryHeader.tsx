import { Button } from "@/components/ui/button";

interface CategoryHeaderProps {
  onAddClick: () => void;
}

export function CategoryHeader({ onAddClick }: CategoryHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Categories</h3>
      <Button onClick={onAddClick}>
        Add Category
      </Button>
    </div>
  );
}