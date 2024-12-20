import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface MenuManagementHeaderProps {
  onAddClick: () => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export function MenuManagementHeader({ onAddClick, isDialogOpen, setIsDialogOpen }: MenuManagementHeaderProps) {
  return (
    <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 py-4 px-2">
      <h2 className="text-2xl font-bold">Menu Management</h2>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={onAddClick}>
            Add Item
          </Button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}